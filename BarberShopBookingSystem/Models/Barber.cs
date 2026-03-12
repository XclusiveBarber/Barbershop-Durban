namespace BarberShopBookingSystem.Models
{
    public class Barber
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Speciality { get; set; }
        public string? ImageUrl { get; set; }
        public bool Available { get; set; }
    }

}
