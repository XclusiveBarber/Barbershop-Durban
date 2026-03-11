using BarberShopBookingSystem.Data;
using BarberShopBookingSystem.Models;
using BarberShopBookingSystem.Services; // Add this for the IEmailService
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public AppointmentsController(ApplicationDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetAllAppointments() =>
            Ok(await _context.Appointments.ToListAsync());

        [HttpGet("my-appointments")]
        public async Task<IActionResult> GetMyAppointments()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();

            var userId = Guid.Parse(userIdClaim);
            var appointments = await _context.Appointments
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();
            return Ok(appointments);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] AppointmentCreateDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            var appointmentDateUtc = dto.AppointmentDate.Date;

            // POLICY: 30-Minute Minimum Notice
            if (DateTime.TryParse($"{appointmentDateUtc.ToShortDateString()} {dto.TimeSlot}", out DateTime requestedTime))
            {
                var localTimeNow = DateTime.UtcNow.AddHours(2); // SAST timezone
                if (requestedTime < localTimeNow.AddMinutes(30))
                {
                    return BadRequest("Appointments must be booked at least 30 minutes in advance.");
                }
            }

            var haircut = await _context.Haircuts.FindAsync(dto.HaircutId);
            if (haircut == null) return NotFound("Haircut not found");

            // POLICY: Auto-Assign Available Barber (Load Balanced & Timezone Proof)
            var allActiveBarbers = await _context.Barbers.Where(b => b.Available).ToListAsync();

            // 1. Force the date to completely ignore timezones by stripping it down to Year/Month/Day
            var targetDate = dto.AppointmentDate.Date;

            var todaysAppointments = await _context.Appointments
                .Where(a => a.AppointmentDate.Year == targetDate.Year &&
                            a.AppointmentDate.Month == targetDate.Month &&
                            a.AppointmentDate.Day == targetDate.Day &&
                            a.Status != "cancelled")
                .ToListAsync();

            // 2. Find who is specifically booked for this EXACT time slot
            var bookedBarberIdsForSlot = todaysAppointments
                .Where(a => a.TimeSlot == dto.TimeSlot)
                .Select(a => a.BarberId)
                .ToList();

            // 3. Filter out busy barbers, sort by workload, AND add a random tie-breaker
            var assignedBarber = allActiveBarbers
                .Where(b => !bookedBarberIdsForSlot.Contains(b.Id)) // Must be free at this exact time
                .OrderBy(b => todaysAppointments.Count(a => a.BarberId == b.Id)) // 1st Rule: Least busy today
                .ThenBy(b => Guid.NewGuid()) // 2nd Rule: Tie-breaker! Pick randomly if they have the same amount
                .FirstOrDefault();

            if (assignedBarber == null) return BadRequest("No barbers are available for this time slot. Please choose another time.");

            decimal finalPrice = haircut.Price;
            if (dto.DiscountAmount > 0) finalPrice -= dto.DiscountAmount;

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BarberId = assignedBarber.Id, // Auto-assigned fairly!
                HaircutId = dto.HaircutId,
                AppointmentDate = appointmentDateUtc,
                TimeSlot = dto.TimeSlot,
                Status = "pending",
                PaymentStatus = "unpaid",
                RescheduleCount = 0,
                TotalPrice = finalPrice,
                AppliedDiscountCode = dto.DiscountCode
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyAppointments), new { }, appointment);
        }

        [HttpPut("{id}/reschedule")]
        public async Task<IActionResult> Reschedule(Guid id, [FromBody] RescheduleDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            // POLICY: Only one reschedule allowed per booking
            if (appointment.RescheduleCount >= 1)
                return BadRequest("Policy: Only one reschedule allowed. Please make a new booking.");

            // POLICY: 2-Hour Notice Rule
            if (DateTime.TryParse($"{appointment.AppointmentDate.ToShortDateString()} {appointment.TimeSlot}", out DateTime currentScheduledTime))
            {
                var localTimeNow = DateTime.UtcNow.AddHours(2); // SAST Time
                var timeUntilAppointment = currentScheduledTime - localTimeNow;

                // If the appointment is in the future but less than 2 hours away
                if (timeUntilAppointment.TotalHours < 2 && timeUntilAppointment.TotalHours > 0)
                {
                    return BadRequest("Policy: Rescheduling requires at least 2 hours' notice.");
                }
            }

            var conflict = await _context.Appointments.AnyAsync(a =>
                a.Id != id &&
                a.BarberId == appointment.BarberId &&
                a.AppointmentDate == dto.NewDate.Date &&
                a.TimeSlot == dto.NewTime &&
                a.Status != "cancelled");

            if (conflict) return BadRequest("The new time slot is already taken.");

            appointment.AppointmentDate = dto.NewDate.Date;
            appointment.TimeSlot = dto.NewTime;
            appointment.RescheduleCount++;

            await _context.SaveChangesAsync();
            return Ok(appointment);
        }

        [HttpPut("{id}/late-arrival")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> HandleLateArrival(Guid id, [FromBody] int minutesLate)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            if (minutesLate >= 30) return BadRequest("Policy: 30 minutes late requires rescheduling to next slot.");
            if (minutesLate > 15) appointment.TotalPrice += 10;

            await _context.SaveChangesAsync();
            return Ok(appointment);
        }

        [HttpPut("{id}/cancel")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CancelAppointment(Guid id, [FromServices] IEmailService emailService)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            appointment.Status = "cancelled";
            await _context.SaveChangesAsync();

            // Look up the customer's profile to get their email
            var profile = await _context.Profiles.FindAsync(appointment.UserId);

            if (profile != null && !string.IsNullOrEmpty(profile.Email))
            {
                // Send the notification using the real email!
                await emailService.SendCancellationEmail(profile.Email, appointment.AppointmentDate.ToShortDateString(), appointment.TimeSlot);
            }

            return Ok("Appointment cancelled and notification sent.");
        }
    }

    public class RescheduleDto
    {
        public DateTime NewDate { get; set; }
        public string NewTime { get; set; } = string.Empty;
    }
}