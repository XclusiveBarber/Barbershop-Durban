namespace BarberShopBookingSystem.Models
{
    public class AppointmentCreateDto
    {
        public Guid HaircutId { get; set; }
        public DateOnly AppointmentDate { get; set; }
        public string TimeSlot { get; set; } = string.Empty;
        public decimal DiscountAmount { get; set; }
        public string? DiscountCode { get; set; }
    }
}                 