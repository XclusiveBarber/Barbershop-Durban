using BarberShopBookingSystem.Data;
using BarberShopBookingSystem.Models;
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
        [Authorize(Roles = "admin")]
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

            var barber = await _context.Barbers.FindAsync(dto.BarberId);
            if (barber == null) return NotFound("Barber not found");

            var haircut = await _context.Haircuts.FindAsync(dto.HaircutId);
            if (haircut == null) return NotFound("Haircut not found");

            var conflict = await _context.Appointments.AnyAsync(a =>
                a.BarberId == dto.BarberId &&
                a.AppointmentDate == appointmentDateUtc &&
                a.TimeSlot == dto.TimeSlot &&
                a.Status != "cancelled");

            if (conflict) return BadRequest("Barber already booked at this time.");

            // DISCOUNT POLICY: Only one discount applied per booking
            decimal finalPrice = haircut.Price;
            if (dto.DiscountAmount > 0)
            {
                finalPrice -= dto.DiscountAmount;
            }

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BarberId = dto.BarberId,
                HaircutId = dto.HaircutId,
                AppointmentDate = appointmentDateUtc,
                TimeSlot = dto.TimeSlot,
                Status = "pending",
                PaymentStatus = "unpaid",
                RescheduleCount = 0,
                TotalPrice = finalPrice, // Stores the final price after the single discount
                AppliedDiscountCode = dto.DiscountCode // Track for "no combined discounts" policy
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

            // RESCHEDULE POLICY: Only one reschedule allowed per booking
            if (appointment.RescheduleCount >= 1)
                return BadRequest("Policy: Only one reschedule allowed. Please make a new booking.");

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

            // BOOKING POLICY: 30 minutes late requires reschedule
            if (minutesLate >= 30)
            {
                return BadRequest("Policy: 30 minutes late requires rescheduling to next slot.");
            }

            // BOOKING POLICY: 15-minute grace period (+R10 if exceeded)
            if (minutesLate > 15)
            {
                appointment.TotalPrice += 10;
            }

            await _context.SaveChangesAsync();
            return Ok(appointment);
        }
    }

    public class RescheduleDto
    {
        public DateTime NewDate { get; set; }
        public string NewTime { get; set; } = string.Empty;
    }

    // Ensure your DTO in the Models folder matches this
    public class AppointmentCreateDto
    {
        public Guid BarberId { get; set; }
        public Guid HaircutId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string TimeSlot { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public string? DiscountCode { get; set; }
    }
}