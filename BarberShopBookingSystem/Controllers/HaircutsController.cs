using BarberShopBookingSystem.Data;
using BarberShopBookingSystem.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HaircutsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public HaircutsController(ApplicationDbContext context) => _context = context;

        [HttpGet]
        public async Task<IActionResult> GetHaircuts()
        {
            var haircuts = await _context.Haircuts.ToListAsync();
            return Ok(new { haircuts });
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddHaircut([FromBody] Haircut haircut)
        {
            // Manual role check — Supabase JWTs don't carry app-level roles
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

            _context.Haircuts.Add(haircut);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetHaircuts), new { id = haircut.Id }, haircut);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateHaircut(Guid id, [FromBody] Haircut haircut)
        {
            // Manual role check — Supabase JWTs don't carry app-level roles
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null) return Unauthorized();
            var adminProfile = await _context.Profiles.FindAsync(Guid.Parse(userIdClaim));
            if (adminProfile == null || adminProfile.Role != "admin") return Forbid();

            var existing = await _context.Haircuts.FindAsync(id);
            if (existing == null) return NotFound();
            existing.Name = haircut.Name;
            existing.Price = haircut.Price;
            existing.Description = haircut.Description;
            existing.ImageUrl = haircut.ImageUrl;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
