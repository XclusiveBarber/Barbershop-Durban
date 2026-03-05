using BarberShopBookingSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace BarberShopBookingSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Barber> Barbers { get; set; }
        public DbSet<Haircut> Haircuts { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Profile> Profiles { get; set; } // Added for user roles and Auth link

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Mapping to lowercase Supabase table names
            modelBuilder.Entity<Barber>().ToTable("barbers");
            modelBuilder.Entity<Haircut>().ToTable("haircuts");
            modelBuilder.Entity<Appointment>().ToTable("appointments");
            modelBuilder.Entity<Profile>().ToTable("profiles");

            // Optional: Ensure Price in Haircuts handles decimal correctly for ZAR
            modelBuilder.Entity<Haircut>()
                .Property(h => h.Price)
                .HasPrecision(18, 2);

 
        }
    }
}