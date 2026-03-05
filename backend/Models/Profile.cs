namespace BarberShopBookingSystem.Models
{
    public class Profile
    {
        public Guid Id { get; set; } // Links to Supabase Auth ID
        public string FullName { get; set; }
        public string Role { get; set; } // 'customer', 'barber', 'admin'
    }
}
