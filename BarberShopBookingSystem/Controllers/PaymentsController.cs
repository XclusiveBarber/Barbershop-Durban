using BarberShopBookingSystem.Data;
using BarberShopBookingSystem.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BarberShopBookingSystem.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
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

            // SECURITY FIX: Verify the appointment belongs to the logged-in user (prevents IDOR)
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            if (appointment.UserId != userId) return Forbid();

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

        // 🚨 ADDED [FromServices] IEmailService here so we can send the email!
        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmPayment([FromBody] ConfirmPaymentRequest request, [FromServices] IEmailService emailService)
        {
            var appointment = await _context.Appointments.FindAsync(request.AppointmentId);
            if (appointment == null) return NotFound("Appointment not found.");

            // SECURITY FIX: Verify the appointment belongs to the logged-in user (prevents IDOR)
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            if (appointment.UserId != userId) return Forbid();

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

            // 5. SECURITY FIX: Check Yoco's official status (Added "completed" to the VIP list)
            var yocoStatus = yocoData.GetProperty("status").GetString()?.ToLower();

            if (yocoStatus == "paid" || yocoStatus == "succeeded" || yocoStatus == "successful" || yocoStatus == "completed")
            {
                // Update the database to reflect the successful payment AND confirm the booking
                appointment.PaymentStatus = "paid";
                appointment.Status = "confirmed";
                await _context.SaveChangesAsync();

                // 🚨 THE FIX: SEND THE CONFIRMATION EMAIL HERE 🚨
                try
                {
                    // Look up the user's email directly from the database
                    var profile = await _context.Profiles.FindAsync(appointment.UserId);
                    var customerEmail = profile?.Email;

                    if (!string.IsNullOrEmpty(customerEmail))
                    {
                        var barber = await _context.Barbers.FindAsync(appointment.BarberId);
                        var barberName = barber?.FullName ?? "Your Barber";

                        var apptServices = await _context.AppointmentServices
                            .Where(aps => aps.AppointmentId == appointment.Id)
                            .ToListAsync();

                        var haircutIds = apptServices.Select(aps => aps.HaircutId).ToList();
                        var haircuts = await _context.Haircuts.Where(h => haircutIds.Contains(h.Id)).ToListAsync();
                        var serviceNames = haircuts.Any() ? string.Join(", ", haircuts.Select(h => h.Name)) : "Haircut Service";

                        await emailService.SendBookingConfirmationEmail(
                            customerEmail,
                            appointment.AppointmentDate.ToString("yyyy-MM-dd"),
                            appointment.TimeSlot,
                            serviceNames,
                            barberName,
                            $"R{appointment.TotalPrice:F0}"
                        );
                    }
                }
                catch (Exception ex)
                {
                    // If the email fails, we log it, but we still return OK to the frontend so the user sees "Success"
                    Console.WriteLine($"Payment succeeded, but email failed: {ex.Message}");
                }

                return Ok(new { message = "Payment verified and successfully recorded.", appointment });
            }

            // If it's anything else, reject it
            return BadRequest($"Payment not complete. Yoco says the status is: '{yocoStatus}'");
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