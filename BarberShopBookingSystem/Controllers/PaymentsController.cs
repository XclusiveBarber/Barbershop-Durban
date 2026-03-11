using BarberShopBookingSystem.Data;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;

        public PaymentsController(IConfiguration config, ApplicationDbContext context)
        {
            _config = config;
            _context = context;
            _httpClient = new HttpClient();
        }

        [HttpPost("create-checkout")]
        public async Task<IActionResult> CreateCheckout([FromBody] PaymentRequest request)
        {
            var secretKey = _config["Yoco:SecretKey"];
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

            // Yoco expects amounts in cents (e.g., R100.00 = 10000)
            var payload = new
            {
                amount = (int)(request.Amount * 100),
                currency = "ZAR",
                // Attach the AppointmentId to the URL so the frontend can grab it on success
                successUrl = $"http://localhost:5173/payment-success?appointmentId={request.AppointmentId}",
                cancelUrl = $"http://localhost:5173/payment-cancelled?appointmentId={request.AppointmentId}"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://payments.yoco.com/api/checkouts", content);
            if (!response.IsSuccessStatusCode)
            {
                var yocoErrorDetails = await response.Content.ReadAsStringAsync();
                return BadRequest($"Yoco rejected the request. Details: {yocoErrorDetails}");
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();

            // This returns the Yoco redirect URL to the frontend
            return Ok(jsonResponse);
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
        {
            var appointment = await _context.Appointments.FindAsync(request.AppointmentId);
            if (appointment == null) return NotFound("Appointment not found.");

            // Update the database to reflect the successful payment
            appointment.PaymentStatus = "paid";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Payment successfully recorded.", appointment });
        }
    }

    public class PaymentRequest
    {
        public decimal Amount { get; set; }
        public Guid AppointmentId { get; set; } // Added to track who is paying
    }

    public class ConfirmPaymentRequest
    {
        public Guid AppointmentId { get; set; }
    }
}