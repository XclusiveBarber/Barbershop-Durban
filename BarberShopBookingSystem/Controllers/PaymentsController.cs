using BarberShopBookingSystem.Data;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

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
            // 1. SECURITY FIX: Fetch the appointment to get the REAL price from the database!
            var appointment = await _context.Appointments.FindAsync(request.AppointmentId);
            if (appointment == null) return NotFound("Appointment not found.");

            var secretKey = _config["Yoco:SecretKey"];
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

            var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:3000";
            // Use first URL if comma-separated list
            var baseUrl = frontendUrl.Split(',')[0].Trim().TrimEnd('/');

            // 2. SECURITY FIX: Use the backend price (appointment.TotalPrice), NOT request.Amount
            var amountInCents = (int)(appointment.TotalPrice * 100);

            var payload = new
            {
                amount = amountInCents,
                currency = "ZAR",
                successUrl = $"{baseUrl}/payment-success?appointmentId={request.AppointmentId}",
                cancelUrl = $"{baseUrl}/payment-cancelled?appointmentId={request.AppointmentId}"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://payments.yoco.com/api/checkouts", content);

            if (!response.IsSuccessStatusCode)
            {
                var yocoErrorDetails = await response.Content.ReadAsStringAsync();
                return BadRequest($"Yoco rejected the request. Details: {yocoErrorDetails}");
            }

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var yocoData = JsonSerializer.Deserialize<JsonElement>(jsonResponse);

            var checkoutId = yocoData.GetProperty("id").GetString();
            var redirectUrl = yocoData.GetProperty("redirectUrl").GetString();

            // 3. SECURITY FIX: Save the Yoco ID to the database so we can verify it later
            appointment.YocoPaymentId = checkoutId;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                redirectUrl = redirectUrl,
                checkoutId = checkoutId,
            });
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request)
        {
            var appointment = await _context.Appointments.FindAsync(request.AppointmentId);
            if (appointment == null) return NotFound("Appointment not found.");

            // Make sure we actually have a Yoco ID saved for this appointment
            if (string.IsNullOrEmpty(appointment.YocoPaymentId))
                return BadRequest("No Yoco checkout associated with this appointment.");

            // 4. SECURITY FIX: Ask Yoco directly if this specific checkout was paid!
            var secretKey = _config["Yoco:SecretKey"];
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);

            var response = await _httpClient.GetAsync($"https://payments.yoco.com/api/checkouts/{appointment.YocoPaymentId}");

            if (!response.IsSuccessStatusCode)
                return BadRequest("Could not verify payment with Yoco.");

            var jsonResponse = await response.Content.ReadAsStringAsync();
            var yocoData = JsonSerializer.Deserialize<JsonElement>(jsonResponse);

            // 5. SECURITY FIX: Check Yoco's official status
            // Yoco Checkout API returns "complete" (not "paid") for a successful checkout
            if (yocoData.GetProperty("status").GetString() == "complete")
            {
                // Update the database to reflect the successful payment AND confirm the booking
                appointment.PaymentStatus = "paid";
                appointment.Status = "confirmed";

                await _context.SaveChangesAsync();
                return Ok(new { message = "Payment verified and successfully recorded.", appointment });
            }

            // If they just typed the URL into their browser but didn't pay:
            return BadRequest("Payment has not been completed. Please finish the transaction on Yoco.");
        }
    }

    public class PaymentRequest
    {
        // We leave this here so the frontend doesn't break, but we completely ignore it in the backend!
        public decimal Amount { get; set; }

        [JsonPropertyName("appointmentId")]
        public Guid AppointmentId { get; set; }
    }

    public class ConfirmPaymentRequest
    {
        [JsonPropertyName("appointmentId")]
        public Guid AppointmentId { get; set; }
    }
}