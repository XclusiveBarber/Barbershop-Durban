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

        // GET all profiles (Admin only)
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetProfiles() =>
            Ok(await _context.Profiles.ToListAsync());

        // GET profile by ID (any role)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProfile(Guid id)
        {
            var profile = await _context.Profiles.FindAsync(id);
            if (profile == null) return NotFound();
            return Ok(profile);
        }

        // POST a new profile (Admin only)
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddProfile([FromBody] Profile profile)
        {
            _context.Profiles.Add(profile);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProfile), new { id = profile.Id }, profile);
        }

        // PUT to update profile role or name (Admin only)
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
    }
}
