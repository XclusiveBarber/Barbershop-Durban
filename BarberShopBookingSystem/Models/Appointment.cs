namespace BarberShopBookingSystem.Models
{
    public class Appointment
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? BarberId { get; set; }
        

        // DELETE THIS LINE:
        // public Guid HaircutId { get; set; }

        // ADD THIS LINE:
        public int TotalDurationMinutes { get; set; } = 30;
        public DateOnly AppointmentDate { get; set; }
        public string TimeSlot { get; set; } = string.Empty;
        public string Status { get; set; } = "pending";

        // Add this right under public string Status { get; set; }
        public bool IsLate { get; set; } = false;

        public string? CustomerPhone { get; set; }

        // New Payment Fields
        public string PaymentStatus { get; set; } = "unpaid";
        public string? YocoPaymentId { get; set; }
        public decimal? AmountPaid { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        public int RescheduleCount { get; set; } = 0;

        // Policy: Store final price after discounts or late fees
        public decimal TotalPrice { get; set; }

        // Policy: Discounts may not be redeemed simultaneously
        public string? AppliedDiscountCode { get; set; }


    }
}