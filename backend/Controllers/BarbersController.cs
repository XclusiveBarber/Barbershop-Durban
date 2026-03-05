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
        public async Task<IActionResult> GetBarbers() =>
            Ok(await _context.Barbers.ToListAsync());

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> AddBarber([FromBody] Barber barber)
        {
            _context.Barbers.Add(barber);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetBarbers), new { id = barber.Id }, barber);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateBarber(Guid id, [FromBody] Barber barber)
        {
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
