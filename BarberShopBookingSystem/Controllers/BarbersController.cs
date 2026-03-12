using BarberShopBookingSystem.Data;
using BarberShopBookingSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BarbersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public BarbersController(ApplicationDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetBarbers()
        {
            var barbers = await _context.Barbers.ToListAsync();
            return Ok(new { barbers });
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddBarber([FromBody] Barber barber)
        {
            // Manual role check — Supabase JWTs don't carry app-level roles
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

            _context.Barbers.Add(barber);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetBarbers), new { id = barber.Id }, barber);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateBarber(Guid id, [FromBody] Barber barber)
        {
            // Manual role check — Supabase JWTs don't carry app-level roles
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

            var existing = await _context.Barbers.FindAsync(id);
            if (existing == null) return NotFound();
            existing.FullName = barber.FullName;
            existing.Speciality = barber.Speciality;
            existing.ImageUrl = barber.ImageUrl;
            existing.Available = barber.Available;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
