namespace BarberShopBookingSystem.Models
{
    public class Haircut
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public string Description { get; set; }
        public string? ImageUrl { get; set; } // The '?' allows null values from the database
        public int DurationMinutes { get; set; } = 30;
    }

}
