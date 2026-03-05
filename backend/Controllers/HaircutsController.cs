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
        public async Task<IActionResult> GetHaircuts() =>
            Ok(await _context.Haircuts.ToListAsync());

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddHaircut([FromBody] Haircut haircut)
        {
            _context.Haircuts.Add(haircut);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetHaircuts), new { id = haircut.Id }, haircut);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateHaircut(Guid id, [FromBody] Haircut haircut)
        {
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
