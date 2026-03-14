using BarberShopBookingSystem.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AvailabilityController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // Mon–Sat: 09:00–18:00 (shop open until 19:00, last slot starts at 18:00)
        private static readonly string[] WeekdaySlots =
        [
            "09:00", "10:00", "11:00", "12:00", "13:00",
            "14:00", "15:00", "16:00", "17:00", "18:00"
        ];

        // Sunday: 09:00–14:00 (shop open until 15:00, last slot starts at 14:00)
        private static readonly string[] SundaySlots =
        [
            "09:00", "10:00", "11:00", "12:00", "13:00", "14:00"
        ];

        public AvailabilityController(ApplicationDbContext context) => _context = context;

        /// <summary>
        /// GET /api/availability?date=2025-08-01
        /// Returns which time slots still have at least one free barber on the given date.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAvailability([FromQuery] string date)
        {
            if (!DateOnly.TryParse(date, out var targetDate))
                return BadRequest("Invalid date format. Use yyyy-MM-dd.");

            var allSlots = targetDate.DayOfWeek == DayOfWeek.Sunday ? SundaySlots : WeekdaySlots;

            var totalBarbers = await _context.Barbers.CountAsync(b => b.Available);
            if (totalBarbers == 0)
                return Ok(new { availableSlots = Array.Empty<string>() });

            // Load all non-cancelled appointments for the requested date
            var bookedSlots = await _context.Appointments
                .Where(a => a.AppointmentDate == targetDate && a.Status != "cancelled")
                .GroupBy(a => a.TimeSlot)
                .Select(g => new { TimeSlot = g.Key, Count = g.Count() })
                .ToListAsync();

            var bookedMap = bookedSlots.ToDictionary(x => x.TimeSlot, x => x.Count);

            // A slot is available if fewer than all barbers are booked for it
            var availableSlots = allSlots
                .Where(slot => !bookedMap.TryGetValue(slot, out var count) || count < totalBarbers)
                .ToArray();

            return Ok(new { availableSlots });
        }
    }
}
