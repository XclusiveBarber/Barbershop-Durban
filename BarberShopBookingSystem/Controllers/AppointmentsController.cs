using BarberShopBookingSystem.Data;
using BarberShopBookingSystem.Models;
using BarberShopBookingSystem.Services;
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

        // GET /api/appointments/my-appointments — customer's own appointments with barber/haircut details
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

            var haircutIds = appointments.Select(a => a.HaircutId).Distinct().ToList();
            var barberIds = appointments.Select(a => a.BarberId).Distinct().ToList();

            var haircuts = await _context.Haircuts.Where(h => haircutIds.Contains(h.Id)).ToListAsync();
            var barbers = await _context.Barbers.Where(b => barberIds.Contains(b.Id)).ToListAsync();

            var haircutMap = haircuts.ToDictionary(h => h.Id);
            var barberMap = barbers.ToDictionary(b => b.Id);

            var result = appointments.Select(a => new
            {
                a.Id,
                a.AppointmentDate,
                a.TimeSlot,
                a.Status,
                a.TotalPrice,
                a.PaymentStatus,
                a.CreatedAt,
                Haircuts = haircutMap.TryGetValue(a.HaircutId, out var hc) ? new { hc.Name, hc.Price } : null,
                Barbers = barberMap.TryGetValue(a.BarberId, out var b) ? new { b.FullName } : null,
            });

            return Ok(new { appointments = result });
        }

        // GET /api/appointments/all — all appointments enriched (for admin/barber dashboards)
        [HttpGet("all")]
        public async Task<IActionResult> GetAllAppointments([FromQuery] string? date)
        {
            var query = _context.Appointments.AsQueryable();

            if (!string.IsNullOrEmpty(date) && DateOnly.TryParse(date, out var targetDate))
            {
                query = query.Where(a => a.AppointmentDate == targetDate);
            }

            var appointments = await query
                .OrderBy(a => a.AppointmentDate)
                .ThenBy(a => a.TimeSlot)
                .ToListAsync();

            var haircutIds = appointments.Select(a => a.HaircutId).Distinct().ToList();
            var barberIds = appointments.Select(a => a.BarberId).Distinct().ToList();
            var userIds = appointments.Select(a => a.UserId).Distinct().ToList();

            var haircuts = await _context.Haircuts.Where(h => haircutIds.Contains(h.Id)).ToListAsync();
            var barbers = await _context.Barbers.Where(b => barberIds.Contains(b.Id)).ToListAsync();
            var profiles = await _context.Profiles.Where(p => userIds.Contains(p.Id)).ToListAsync();

            var haircutMap = haircuts.ToDictionary(h => h.Id);
            var barberMap = barbers.ToDictionary(b => b.Id);
            var profileMap = profiles.ToDictionary(p => p.Id);

            var result = appointments.Select(a =>
            {
                var haircut = haircutMap.TryGetValue(a.HaircutId, out var hc) ? hc : null;
                var barber = barberMap.TryGetValue(a.BarberId, out var br) ? br : null;
                var profile = profileMap.TryGetValue(a.UserId, out var pr) ? pr : null;

                return new
                {
                    a.Id,
                    ServiceName = haircut?.Name ?? "Unknown",
                    ServicePrice = $"R{a.TotalPrice:F0}",
                    AppointmentDate = a.AppointmentDate.ToString("yyyy-MM-dd"),
                    AppointmentTime = a.TimeSlot,
                    a.Status,
                    BarberName = barber?.FullName ?? "Unassigned",
                    CustomerName = profile?.FullName ?? "Unknown",
                    CustomerEmail = profile?.Email,
                    CustomerPhone = "",
                };
            });

            return Ok(new { appointments = result });
        }

        // POST /api/appointments — create a new appointment
        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] AppointmentCreateDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            var appointmentDateUtc = dto.AppointmentDate;

            // POLICY: 30-Minute Minimum Notice
            if (DateTime.TryParse($"{dto.AppointmentDate.ToString("yyyy-MM-dd")} {dto.TimeSlot}", out DateTime requestedTime))
            {
                var localTimeNow = DateTime.UtcNow.AddHours(2); // SAST timezone
                if (requestedTime < localTimeNow.AddMinutes(30))
                    return BadRequest("Appointments must be booked at least 30 minutes in advance.");
            }

            var haircut = await _context.Haircuts.FindAsync(dto.HaircutId);
            if (haircut == null) return NotFound("Haircut not found");

            // POLICY: Auto-Assign Available Barber (Load Balanced)
            var allActiveBarbers = await _context.Barbers.Where(b => b.Available).ToListAsync();
            var targetDate = dto.AppointmentDate;

            var todaysAppointments = await _context.Appointments
                .Where(a => a.AppointmentDate == targetDate && a.Status != "cancelled")
                .ToListAsync();

            var bookedBarberIdsForSlot = todaysAppointments
                .Where(a => a.TimeSlot == dto.TimeSlot)
                .Select(a => a.BarberId)
                .ToList();

            var assignedBarber = allActiveBarbers
                .Where(b => !bookedBarberIdsForSlot.Contains(b.Id))
                .OrderBy(b => todaysAppointments.Count(a => a.BarberId == b.Id))
                .ThenBy(b => Guid.NewGuid())
                .FirstOrDefault();

            if (assignedBarber == null)
                return BadRequest("No barbers are available for this time slot. Please choose another time.");

            decimal finalPrice = haircut.Price;
            if (dto.DiscountAmount > 0) finalPrice -= dto.DiscountAmount;

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BarberId = assignedBarber.Id,
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

        // DELETE /api/appointments/{id} — customer cancels their own appointment
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            if (appointment.UserId != userId) return Forbid();

            appointment.Status = "cancelled";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment cancelled." });
        }

        // PATCH /api/appointments/{id} — update appointment status (admin/barber)
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateAppointmentStatus(Guid id, [FromBody] UpdateStatusDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            var validStatuses = new[] { "pending", "confirmed", "completed", "cancelled", "late" };
            if (!validStatuses.Contains(dto.Status))
                return BadRequest("Invalid status.");

            appointment.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(appointment);
        }

        // PUT /api/appointments/{id}/reschedule
        [HttpPut("{id}/reschedule")]
        public async Task<IActionResult> Reschedule(Guid id, [FromBody] RescheduleDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            if (appointment.RescheduleCount >= 1)
                return BadRequest("Policy: Only one reschedule allowed. Please make a new booking.");

            if (DateTime.TryParse($"{appointment.AppointmentDate.ToString("yyyy-MM-dd")} {appointment.TimeSlot}", out DateTime currentScheduledTime))
            {
                var localTimeNow = DateTime.UtcNow.AddHours(2);
                var timeUntilAppointment = currentScheduledTime - localTimeNow;
                if (timeUntilAppointment.TotalHours < 2 && timeUntilAppointment.TotalHours > 0)
                    return BadRequest("Policy: Rescheduling requires at least 2 hours' notice.");
            }

            var newDate = DateOnly.FromDateTime(dto.NewDate);

            var conflict = await _context.Appointments.AnyAsync(a =>
                a.Id != id &&
                a.BarberId == appointment.BarberId &&
                a.AppointmentDate == newDate &&
                a.TimeSlot == dto.NewTime &&
                a.Status != "cancelled");

            if (conflict) return BadRequest("The new time slot is already taken.");

            appointment.AppointmentDate = newDate;
            appointment.TimeSlot = dto.NewTime;
            appointment.RescheduleCount++;
            await _context.SaveChangesAsync();

            return Ok(appointment);
        }

        // PUT /api/appointments/{id}/late-arrival — admin only
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

        // PUT /api/appointments/{id}/cancel — admin cancel with email notification
        [HttpPut("{id}/cancel")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> CancelAppointment(Guid id, [FromServices] IEmailService emailService)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            appointment.Status = "cancelled";
            await _context.SaveChangesAsync();

            var profile = await _context.Profiles.FindAsync(appointment.UserId);
            if (profile != null && !string.IsNullOrEmpty(profile.Email))
                await emailService.SendCancellationEmail(profile.Email, appointment.AppointmentDate.ToString("yyyy-MM-dd"), appointment.TimeSlot);

            return Ok("Appointment cancelled and notification sent.");
        }
    }

    public class RescheduleDto
    {
        public DateTime NewDate { get; set; }
        public string NewTime { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
