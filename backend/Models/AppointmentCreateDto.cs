namespace BarberShopBookingSystem.Models
{
    public class AppointmentCreateDto
    {
        public Guid BarberId { get; set; }
        public Guid HaircutId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string TimeSlot { get; set; } = string.Empty;

        // New fields for the Discount Policy
        public decimal DiscountAmount { get; set; }
        public string? DiscountCode { get; set; }
    }
}