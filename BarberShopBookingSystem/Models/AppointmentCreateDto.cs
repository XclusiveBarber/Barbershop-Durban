using System.Text.Json.Serialization;

namespace BarberShopBookingSystem.Models
{
    public class AppointmentCreateDto
    {
        [JsonPropertyName("haircutIds")]
        public List<Guid> HaircutIds { get; set; } = new List<Guid>();

        [JsonPropertyName("appointmentDate")]
        public DateOnly AppointmentDate { get; set; }

        [JsonPropertyName("timeSlot")]
        public string TimeSlot { get; set; } = string.Empty;

        [JsonPropertyName("discountAmount")]
        public decimal DiscountAmount { get; set; }

        [JsonPropertyName("discountCode")]
        public string? DiscountCode { get; set; }

        [JsonPropertyName("customerPhone")]
        public string? CustomerPhone { get; set; }
    }
}
