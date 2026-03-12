namespace BarberShopBookingSystem.Models
{
    public class Profile
    {
        public Guid Id { get; set; }
        public string? FullName { get; set; }
        public string? Role { get; set; } = "customer";

        // NEW: Needed for the cancellation notifications
        public string? Email { get; set; }
    }
}