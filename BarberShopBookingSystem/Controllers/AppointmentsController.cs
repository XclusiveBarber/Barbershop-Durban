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
              .Where(a => a.UserId == userId || a.BarberId == userId)
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
            // 1. 🚨 SECURITY FIX: Identify who is asking for the data
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var userId = Guid.Parse(userIdClaim);

            var userProfile = await _context.Profiles.FindAsync(userId);

            // Kick out regular customers trying to see the shop calendar
            if (userProfile == null || (userProfile.Role != "admin" && userProfile.Role != "barber"))
                return Forbid();

            var localTimeNow = DateTime.UtcNow.AddHours(2); // SAST
            var today = DateOnly.FromDateTime(localTimeNow);

            bool needsSave = false;

            // --- 10-MINUTE CART ABANDONMENT FIX ---
            var expiryTime = localTimeNow.AddMinutes(-10);
            var abandonedBookings = await _context.Appointments
                .Where(a => a.Status == "pending" && a.PaymentStatus == "unpaid" && a.CreatedAt < expiryTime)
                .ToListAsync();

            foreach (var abandoned in abandonedBookings)
            {
                abandoned.Status = "cancelled";
                needsSave = true;
            }

            // --- 30-MINUTE NO-SHOW FIX ---
            var staleCheck = await _context.Appointments
                .Where(a => a.Status == "pending" && a.AppointmentDate <= today)
                .ToListAsync();

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

            // 🚨 THE RACE CONDITION FIX 🚨
            if (needsSave)
            {
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (Exception)
                {
                    // Clear the tracked changes so the context doesn't stay poisoned
                    _context.ChangeTracker.Clear();
                }
            }

            var query = _context.Appointments.AsQueryable();

            // 2. 🚨 THE BARBER FIX: If they are a barber, strictly filter the calendar to only their cuts!
            if (userProfile.Role == "barber")
            {
                query = query.Where(a => a.BarberId == userId);
            }

            // 3. Date Filter
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

        // GET /api/appointments/available-slots
        [HttpGet("available-slots")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailableSlots([FromQuery] string date)
        {
            if (!DateOnly.TryParse(date, out var targetDate))
                return BadRequest(new { error = "Invalid date format. Use YYYY-MM-DD." });

            // 1. Get the shop capacity (2 active barbers = 2 spots per time slot)
            var totalActiveBarbers = await _context.Barbers.CountAsync(b => b.Available);
            if (totalActiveBarbers == 0)
                return Ok(new List<string>());

            // 2. Set the hours based on the day of the week!
            var standardSlots = new List<string>();
            if (targetDate.DayOfWeek == DayOfWeek.Sunday)
            {
                // Sunday: 9:00 AM to 3:00 PM (Last cut starts at 14:00)
                standardSlots = new List<string> { "09:00", "10:00", "11:00", "12:00", "13:00", "14:00" };
            }
            else
            {
                // Mon - Sat: 9:00 AM to 7:00 PM (Last cut starts at 18:00)
                standardSlots = new List<string> { "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00" };
            }

            var bookedAppointments = await _context.Appointments
                .Where(a => a.AppointmentDate == targetDate && a.Status != "cancelled")
                .ToListAsync();

            var availableSlots = new List<string>();
            var localTimeNow = DateTime.UtcNow.AddHours(2); // SAST
            var isToday = targetDate == DateOnly.FromDateTime(localTimeNow);

            // 3. Do the math for every single slot
            foreach (var slot in standardSlots)
            {
                // Hide past slots if the customer is looking at today's calendar
                if (isToday && DateTime.TryParse($"{date} {slot}", out DateTime slotTime))
                {
                    if (slotTime < localTimeNow.AddMinutes(30)) continue;
                }

                // Check exactly how many cuts are booked for this specific hour
                var bookingsForThisSlot = bookedAppointments.Count(a => a.TimeSlot == slot);

                // If bookings (e.g. 1) is less than our total barbers (2), the slot stays open!
                // It ONLY closes when it hits 2/2.
                if (bookingsForThisSlot < totalActiveBarbers)
                {
                    availableSlots.Add(slot);
                }
            }

            return Ok(availableSlots);
        }

        // POST /api/appointments
        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] AppointmentCreateDto dto, [FromServices] IEmailService emailService)
        {
            if (!dto.TimeSlot.EndsWith(":00"))
            {
                return BadRequest(new { error = "Appointments can only be booked exactly on the hour (e.g., 09:00, 10:00)." });
            }

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

            if (dto.HaircutIds == null || !dto.HaircutIds.Any())
                return BadRequest(new { error = "You must select at least one service." });

            var selectedHaircuts = await _context.Haircuts
                .Where(h => dto.HaircutIds.Contains(h.Id))
                .ToListAsync();

            if (!selectedHaircuts.Any())
                return NotFound(new { error = "Selected services could not be found." });

            decimal finalPrice = selectedHaircuts.Sum(h => h.Price) - dto.DiscountAmount;
            int totalDuration = selectedHaircuts.Sum(h => h.DurationMinutes);

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
                TotalDurationMinutes = totalDuration,
                AppliedDiscountCode = dto.DiscountCode,
                CustomerPhone = dto.CustomerPhone
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

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
        public async Task<IActionResult> DeleteAppointment(Guid id, [FromServices] IEmailService emailService)
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

            var profile = await _context.Profiles.FindAsync(userId);
            var customerEmail = profile?.Email;

            if (!string.IsNullOrEmpty(customerEmail))
                await emailService.SendSelfCancellationEmail(customerEmail, appointment.AppointmentDate.ToString("yyyy-MM-dd"), appointment.TimeSlot);

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
        public async Task<IActionResult> Reschedule(Guid id, [FromBody] RescheduleDto dto, [FromServices] IEmailService emailService)
        {
            if (!dto.NewTime.EndsWith(":00"))
            {
                return BadRequest("Appointments can only be rescheduled to exactly on the hour (e.g., 09:00, 10:00).");
            }

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
            var allActiveBarbers = await _context.Barbers.Where(b => b.Available).ToListAsync();

            var todaysAppointments = await _context.Appointments
                .Where(a => a.AppointmentDate == newDate && a.Status != "cancelled" && a.Id != id)
                .ToListAsync();

            var bookedBarberIdsForSlot = todaysAppointments
                .Where(a => a.TimeSlot == dto.NewTime)
                .Select(a => a.BarberId)
                .ToList();

            var availableBarber = allActiveBarbers
                .Where(b => !bookedBarberIdsForSlot.Contains(b.Id))
                .OrderBy(b => todaysAppointments.Count(a => a.BarberId == b.Id))
                .ThenBy(b => Guid.NewGuid())
                .FirstOrDefault();

            if (availableBarber == null)
                return BadRequest("The new time slot is completely booked. Please choose another time.");

            appointment.BarberId = availableBarber.Id;
            appointment.AppointmentDate = newDate;
            appointment.TimeSlot = dto.NewTime;
            appointment.RescheduleCount++;

            await _context.SaveChangesAsync();

            var profile = await _context.Profiles.FindAsync(appointment.UserId);
            var customerEmail = profile?.Email;

            if (!string.IsNullOrEmpty(customerEmail))
            {
                var apptServices = await _context.AppointmentServices
                    .Where(aps => aps.AppointmentId == appointment.Id)
                    .ToListAsync();
                var haircutIds = apptServices.Select(aps => aps.HaircutId).ToList();
                var haircuts = await _context.Haircuts.Where(h => haircutIds.Contains(h.Id)).ToListAsync();
                var serviceNames = string.Join(", ", haircuts.Select(h => h.Name));

                var barber = appointment.BarberId.HasValue
                    ? await _context.Barbers.FindAsync(appointment.BarberId.Value)
                    : null;

                await emailService.SendRescheduleEmail(
                    customerEmail,
                    newDate.ToString("yyyy-MM-dd"),
                    dto.NewTime,
                    serviceNames,
                    barber?.FullName ?? "Your barber"
                );
            }

            return Ok(appointment);
        }

        // PUT /api/appointments/{id}/late-arrival 
        [HttpPut("{id}/late-arrival")]
        public async Task<IActionResult> HandleLateArrival(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized(new { error = "Not logged in" });

            var userProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));

            if (userProfile == null || (userProfile.Role != "admin" && userProfile.Role != "barber"))
                return Forbid();

            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound(new { error = "Appointment not found." });

            if (appointment.IsLate)
                return BadRequest(new { error = "This appointment is already marked as late." });

            if (!DateTime.TryParse($"{appointment.AppointmentDate:yyyy-MM-dd} {appointment.TimeSlot}", out DateTime scheduledTime))
                return BadRequest(new { error = "System error: Could not read appointment time." });

            var localTimeNow = DateTime.UtcNow.AddHours(2); // SAST Timezone

            if (localTimeNow < scheduledTime)
                return BadRequest(new { error = "You cannot mark an appointment as late before its scheduled time." });

            int minutesLate = (int)(localTimeNow - scheduledTime).TotalMinutes;

            if (minutesLate >= 30)
                return BadRequest(new { error = $"Customer is {minutesLate} minutes late. Policy requires rescheduling." });

            appointment.IsLate = true;

            if (minutesLate > 15)
            {
                appointment.TotalPrice += 10;
                await _context.SaveChangesAsync();
                return Ok(new { appointment, message = $"Customer marked {minutesLate} mins late. R10 penalty applied." });
            }

            await _context.SaveChangesAsync();
            return Ok(new { appointment, message = $"Customer marked {minutesLate} mins late. No penalty applied." });
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
            var cancelEmail = profile?.Email;
            if (!string.IsNullOrEmpty(cancelEmail))
                await emailService.SendCancellationEmail(cancelEmail, appointment.AppointmentDate.ToString("yyyy-MM-dd"), appointment.TimeSlot);

            return Ok("Appointment cancelled and notification sent.");
        }
    }

    public class AppointmentCreateDto
    {
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
        [JsonPropertyName("newDate")]
        public DateTime NewDate { get; set; }

        [JsonPropertyName("newTime")]
        public string NewTime { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }
}