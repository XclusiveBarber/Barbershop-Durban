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

        // Time slots matching the barbershop's operating hours (09:00 – 17:00, 1-hour intervals)
        private static readonly string[] AllSlots =
        [
            "09:00", "10:00", "11:00", "12:00", "13:00",
            "14:00", "15:00", "16:00", "17:00"
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
            var availableSlots = AllSlots
                .Where(slot => !bookedMap.TryGetValue(slot, out var count) || count < totalBarbers)
                .ToArray();

            return Ok(new { availableSlots });
        }
    }
}
