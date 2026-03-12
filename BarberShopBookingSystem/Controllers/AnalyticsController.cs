using BarberShopBookingSystem.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public AnalyticsController(ApplicationDbContext context) => _context = context;

        // GET /api/analytics?period=day|week|month|year
        [HttpGet]
        public async Task<IActionResult> GetAnalytics([FromQuery] string period = "week")
        {
            var now = DateTime.UtcNow.AddHours(2); // SAST

            // This calculates as a DateTime
            var startDate = period switch
            {
                "day" => now.Date,
                "week" => now.AddDays(-7).Date,
                "month" => now.AddMonths(-1).Date,
                "year" => now.AddYears(-1).Date,
                _ => now.AddDays(-7).Date,
            };

            // THE FIX: Convert the DateTime to DateOnly before asking the database
            var targetDate = DateOnly.FromDateTime(startDate);

            // Now the database query will compare DateOnly to DateOnly perfectly
            var appointments = await _context.Appointments
                .Where(a => a.AppointmentDate >= targetDate)
                .ToListAsync();

            var completed = appointments.Where(a => a.Status == "completed").ToList();
            var cancelled = appointments.Where(a => a.Status == "cancelled").ToList();
            var totalRevenue = completed.Sum(a => a.TotalPrice);
            var cancellationRate = appointments.Count > 0
                ? Math.Round((double)cancelled.Count / appointments.Count * 100, 1)
                : 0.0;

            // Popular services
            var haircutIds = appointments.Select(a => a.HaircutId).Distinct().ToList();
            var haircuts = await _context.Haircuts.Where(h => haircutIds.Contains(h.Id)).ToListAsync();
            var haircutMap = haircuts.ToDictionary(h => h.Id, h => h.Name);

            var popularServices = appointments
                .GroupBy(a => a.HaircutId)
                .Select(g => new
                {
                    ServiceName = haircutMap.TryGetValue(g.Key, out var name) ? name : "Unknown",
                    Bookings = g.Count(),
                })
                .OrderByDescending(s => s.Bookings)
                .ToList();

            // Barber performance
            var barberIds = appointments.Select(a => a.BarberId).Distinct().ToList();
            var barbers = await _context.Barbers.Where(b => barberIds.Contains(b.Id)).ToListAsync();
            var barberMap = barbers.ToDictionary(b => b.Id, b => b.FullName);

            var barberStats = appointments
                .GroupBy(a => a.BarberId)
                .Select(g => new
                {
                    BarberName = barberMap.TryGetValue(g.Key, out var name) ? name : "Unknown",
                    TotalAppointments = g.Count(),
                    Revenue = g.Where(a => a.Status == "completed").Sum(a => a.TotalPrice),
                })
                .OrderByDescending(b => b.TotalAppointments)
                .ToList();

            var uniqueCustomers = appointments.Select(a => a.UserId).Distinct().Count();

            return Ok(new
            {
                Revenue = new
                {
                    Total = totalRevenue,
                    CompletedAppointments = completed.Count,
                },
                CustomerMetrics = new
                {
                    UniqueCustomers = uniqueCustomers,
                },
                CancellationRate = cancellationRate,
                PopularServices = popularServices,
                BarberStats = barberStats,
            });
        }
    }
}