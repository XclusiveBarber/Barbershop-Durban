using BarberShopBookingSystem.Data;
using BarberShopBookingSystem.Models;
using BarberShopBookingSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AppointmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public AppointmentsController(ApplicationDbContext context) => _context = context;

        // GET /api/appointments/my-appointments
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

            var apptIds = appointments.Select(a => a.Id).ToList();
            var barberIds = appointments.Where(a => a.BarberId.HasValue).Select(a => a.BarberId.Value).Distinct().ToList();

            // Pull the multi-services from the new junction table
            var apptServices = await _context.AppointmentServices
                .Where(aps => apptIds.Contains(aps.AppointmentId))
                .ToListAsync();

            var haircutIds = apptServices.Select(aps => aps.HaircutId).Distinct().ToList();
            var haircuts = await _context.Haircuts.Where(h => haircutIds.Contains(h.Id)).ToListAsync();
            var barbers = await _context.Barbers.Where(b => barberIds.Contains(b.Id)).ToListAsync();

            var haircutMap = haircuts.ToDictionary(h => h.Id);
            var barberMap = barbers.ToDictionary(b => b.Id);

            var result = appointments.Select(a =>
            {
                // Grab all services for this specific appointment
                var serviceIdsForThisAppt = apptServices.Where(aps => aps.AppointmentId == a.Id).Select(aps => aps.HaircutId);
                var servicesList = serviceIdsForThisAppt.Select(id => haircutMap.TryGetValue(id, out var h) ? h.Name : "Unknown").ToList();

                return new
                {
                    a.Id,
                    a.AppointmentDate,
                    a.TimeSlot,
                    a.Status,
                    a.TotalPrice,
                    a.PaymentStatus,
                    a.CreatedAt,
                    Services = string.Join(", ", servicesList), // e.g. "Haircut, Beard Trim"
                    Barbers = a.BarberId.HasValue && barberMap.TryGetValue(a.BarberId.Value, out var b) ? new { b.FullName } : null,
                };
            });

            return Ok(new { appointments = result });
        }

        // GET /api/appointments/all 
        [HttpGet("all")]
        public async Task<IActionResult> GetAllAppointments([FromQuery] string? date)
        {
            var localTimeNow = DateTime.UtcNow.AddHours(2); // SAST
            var today = DateOnly.FromDateTime(localTimeNow);

            var staleCheck = await _context.Appointments
                .Where(a => a.Status == "pending" && a.AppointmentDate <= today)
                .ToListAsync();

            bool needsSave = false;
            foreach (var appt in staleCheck)
            {
                if (DateTime.TryParse($"{appt.AppointmentDate:yyyy-MM-dd} {appt.TimeSlot}", out DateTime apptTime))
                {
                    if (apptTime.AddMinutes(30) < localTimeNow)
                    {
                        appt.Status = "no-show";
                        needsSave = true;
                    }
                }
            }
            if (needsSave) await _context.SaveChangesAsync();

            var query = _context.Appointments.AsQueryable();

            if (!string.IsNullOrEmpty(date) && DateOnly.TryParse(date, out var targetDate))
            {
                query = query.Where(a => a.AppointmentDate == targetDate);
            }

            var appointments = await query
                .OrderBy(a => a.AppointmentDate)
                .ThenBy(a => a.TimeSlot)
                .ToListAsync();

            var apptIds = appointments.Select(a => a.Id).ToList();
            var barberIds = appointments.Where(a => a.BarberId.HasValue).Select(a => a.BarberId.Value).Distinct().ToList();
            var userIds = appointments.Select(a => a.UserId).Distinct().ToList();

            var apptServices = await _context.AppointmentServices.Where(aps => apptIds.Contains(aps.AppointmentId)).ToListAsync();
            var haircutIds = apptServices.Select(aps => aps.HaircutId).Distinct().ToList();

            var haircuts = await _context.Haircuts.Where(h => haircutIds.Contains(h.Id)).ToListAsync();
            var barbers = await _context.Barbers.Where(b => barberIds.Contains(b.Id)).ToListAsync();
            var profiles = await _context.Profiles.Where(p => userIds.Contains(p.Id)).ToListAsync();

            var haircutMap = haircuts.ToDictionary(h => h.Id);
            var barberMap = barbers.ToDictionary(b => b.Id);
            var profileMap = profiles.ToDictionary(p => p.Id);

            var result = appointments.Select(a =>
            {
                var barber = a.BarberId.HasValue && barberMap.TryGetValue(a.BarberId.Value, out var br) ? br : null;
                var profile = profileMap.TryGetValue(a.UserId, out var pr) ? pr : null;

                var serviceIdsForThisAppt = apptServices.Where(aps => aps.AppointmentId == a.Id).Select(aps => aps.HaircutId);
                var servicesList = serviceIdsForThisAppt.Select(id => haircutMap.TryGetValue(id, out var h) ? h.Name : "Unknown").ToList();

                return new
                {
                    a.Id,
                    ServiceName = servicesList.Any() ? string.Join(", ", servicesList) : "Unknown",
                    ServicePrice = $"R{a.TotalPrice:F0}",
                    AppointmentDate = a.AppointmentDate.ToString("yyyy-MM-dd"),
                    AppointmentTime = a.TimeSlot,
                    a.Status,
                    BarberName = barber?.FullName ?? "Unassigned",
                    CustomerName = profile?.FullName ?? "Unknown",
                    CustomerEmail = profile?.Email,
                    CustomerPhone = a.CustomerPhone ?? "",
                };
            });

            return Ok(new { appointments = result });
        }

        // POST /api/appointments
        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] AppointmentCreateDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized(new { error = "Unauthorized. Please log in again." });
            var userId = Guid.Parse(userIdClaim);

            var appointmentDateUtc = dto.AppointmentDate;

            if (DateTime.TryParse($"{dto.AppointmentDate:yyyy-MM-dd} {dto.TimeSlot}", out DateTime requestedTime))
            {
                if (requestedTime.Year == 1)
                    return BadRequest(new { error = "System error: The date was missing or incorrectly formatted." });

                var localTimeNow = DateTime.UtcNow.AddHours(2);

                if (requestedTime < localTimeNow.AddMinutes(30))
                    return BadRequest(new { error = "Appointments must be booked at least 30 minutes in advance." });
            }
            else
            {
                return BadRequest(new { error = "Could not read the appointment time format." });
            }

            // --- THE NEW MULTI-SERVICE CART MATH ---
            if (dto.HaircutIds == null || !dto.HaircutIds.Any())
                return BadRequest(new { error = "You must select at least one service." });

            var selectedHaircuts = await _context.Haircuts
                .Where(h => dto.HaircutIds.Contains(h.Id))
                .ToListAsync();

            if (!selectedHaircuts.Any())
                return NotFound(new { error = "Selected services could not be found." });

            decimal finalPrice = selectedHaircuts.Sum(h => h.Price) - dto.DiscountAmount;
            int totalDuration = selectedHaircuts.Sum(h => h.DurationMinutes);
            // ---------------------------------------

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
                return BadRequest(new { error = "No barbers are available for this time slot. Please choose another time." });

            var appointment = new Appointment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BarberId = assignedBarber.Id,
                AppointmentDate = appointmentDateUtc,
                TimeSlot = dto.TimeSlot,
                Status = "pending",
                PaymentStatus = "unpaid",
                RescheduleCount = 0,
                TotalPrice = finalPrice,
                TotalDurationMinutes = totalDuration, // Saved for future time-blocking math
                AppliedDiscountCode = dto.DiscountCode,
                CustomerPhone = dto.CustomerPhone
            };

            _context.Appointments.Add(appointment);

            // SAVE THE SERVICES TO THE JUNCTION TABLE
            foreach (var haircut in selectedHaircuts)
            {
                _context.AppointmentServices.Add(new AppointmentService
                {
                    AppointmentId = appointment.Id,
                    HaircutId = haircut.Id
                });
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyAppointments), new { }, appointment);
        }

        // DELETE /api/appointments/{id} 
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();
            if (appointment.UserId != userId) return Forbid();

            if (DateTime.TryParse($"{appointment.AppointmentDate:yyyy-MM-dd} {appointment.TimeSlot}", out DateTime scheduledTime))
            {
                var localTimeNow = DateTime.UtcNow.AddHours(2);
                var hoursUntilAppointment = (scheduledTime - localTimeNow).TotalHours;

                if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 2)
                {
                    return BadRequest(new { error = "Policy: Cancellations within 2 hours of the appointment are strictly prohibited. Please call the shop directly." });
                }
            }

            appointment.Status = "cancelled";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment cancelled." });
        }

        // PATCH /api/appointments/{id} 
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateAppointmentStatus(Guid id, [FromBody] UpdateStatusDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            var validStatuses = new[] { "pending", "confirmed", "completed", "cancelled", "late", "no-show" };
            var requestedStatus = dto.Status?.ToLower();

            if (string.IsNullOrEmpty(requestedStatus) || !validStatuses.Contains(requestedStatus))
                return BadRequest(new { error = $"Invalid status. Must be one of: {string.Join(", ", validStatuses)}" });

            appointment.Status = requestedStatus;
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

        // PUT /api/appointments/{id}/late-arrival 
        [HttpPut("{id}/late-arrival")]
        public async Task<IActionResult> HandleLateArrival(Guid id, [FromBody] int minutesLate)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            if (minutesLate >= 30) return BadRequest("Policy: 30 minutes late requires rescheduling.");

            appointment.IsLate = true;

            if (minutesLate > 15) appointment.TotalPrice += 10;

            await _context.SaveChangesAsync();
            return Ok(appointment);
        }

        // PUT /api/appointments/{id}/cancel 
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelAppointment(Guid id, [FromServices] IEmailService emailService)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

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

    public class AppointmentCreateDto
    {
        // --- CHANGED THIS TO ACCEPT AN ARRAY OF IDs ---
        [JsonPropertyName("haircutIds")]
        public List<Guid> HaircutIds { get; set; } = new List<Guid>();

        [JsonPropertyName("appointmentDate")]
        public DateOnly AppointmentDate { get; set; }

        [JsonPropertyName("timeSlot")]
        public string TimeSlot { get; set; } = string.Empty;

        [JsonPropertyName("discountAmount")]
        public decimal DiscountAmount { get; set; }

        [JsonPropertyName("discountCode")]
        public string? DiscountCode { get; set; }

        [JsonPropertyName("customerPhone")]
        public string? CustomerPhone { get; set; }
    }

    public class RescheduleDto
    {
        public DateTime NewDate { get; set; }
        public string NewTime { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }
}