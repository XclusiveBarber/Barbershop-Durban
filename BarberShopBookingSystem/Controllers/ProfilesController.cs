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
        [Authorize]
        public async Task<IActionResult> GetProfiles()
        {
            // Manual role check — Supabase JWTs don't carry app-level roles
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

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
        [Authorize]
        public async Task<IActionResult> AddProfile([FromBody] Profile profile)
        {
            // Manual role check — Supabase JWTs don't carry app-level roles
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProfile), new { id = profile.Id }, profile);
        }

        // PUT /api/profiles/{id} (admin only)
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile(Guid id, [FromBody] Profile profile)
        {
            // Manual role check — Supabase JWTs don't carry app-level roles
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

            var existing = await _context.Profiles.FindAsync(id);
            if (existing == null) return NotFound();
            existing.FullName = profile.FullName;
            existing.Role = profile.Role;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PATCH /api/profiles — update customer notes/preferences (no-op, fields not in current schema)
        [HttpPatch]
        [Authorize]
        public async Task<IActionResult> UpdateCustomer([FromBody] object dto)
        {
            // Manual role check — Supabase JWTs don't carry app-level roles
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

            return Ok();
        }
    }
}
