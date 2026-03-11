using BarberShopBookingSystem.Data;
using BarberShopBookingSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfilesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public ProfilesController(ApplicationDbContext context) => _context = context;

        // GET /api/profiles — CRM customer list with appointment stats (admin only)
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetProfiles()
        {
            var profiles = await _context.Profiles
                .Where(p => p.Role == "customer")
                .ToListAsync();

            var userIds = profiles.Select(p => p.Id).ToList();

            var appointmentStats = await _context.Appointments
                .Where(a => userIds.Contains(a.UserId))
                .GroupBy(a => a.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    TotalAppointments = g.Count(),
                    LastVisit = g.Max(a => a.AppointmentDate)
                })
                .ToListAsync();

            var statsMap = appointmentStats.ToDictionary(s => s.UserId);

            var customers = profiles.Select(p =>
            {
                statsMap.TryGetValue(p.Id, out var stats);
                return new
                {
                    p.Id,
                    Name = p.FullName,
                    p.Email,
                    Phone = "",
                    TotalAppointments = stats?.TotalAppointments ?? 0,
                    LastVisit = stats?.LastVisit,
                    Preferences = "",
                    Notes = "",
                };
            });

            return Ok(new { customers });
        }

        // GET /api/profiles/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(Guid id)
        {
            var profile = await _context.Profiles.FindAsync(id);
            if (profile == null) return NotFound();
            return Ok(profile);
        }

        // POST /api/profiles (admin only)
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddProfile([FromBody] Profile profile)
        {
            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProfile), new { id = profile.Id }, profile);
        }

        // PUT /api/profiles/{id} (admin only)
        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateProfile(Guid id, [FromBody] Profile profile)
        {
            var existing = await _context.Profiles.FindAsync(id);
            if (existing == null) return NotFound();
            existing.FullName = profile.FullName;
            existing.Role = profile.Role;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PATCH /api/profiles — update customer notes/preferences (no-op, fields not in current schema)
        [HttpPatch]
        [Authorize(Roles = "admin")]
        public IActionResult UpdateCustomer([FromBody] object dto)
        {
            return Ok();
        }
    }
}
