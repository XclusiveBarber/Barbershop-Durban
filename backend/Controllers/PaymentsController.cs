namespace BarberShopBookingSystem.Controllers
{
    using Microsoft.AspNetCore.Mvc;
    using System.Net.Http.Headers;
    using System.Text;
    using System.Text.Json;

    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public PaymentsController(IConfiguration config)
        {
            _config = config;
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
                successUrl = "http://localhost:5173/payment-success",
                cancelUrl = "http://localhost:5173/payment-cancelled"
            };

            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("https://online.yoco.com/v1/checkouts", content);

            if (!response.IsSuccessStatusCode) return BadRequest("Yoco session creation failed.");

            var jsonResponse = await response.Content.ReadAsStringAsync();
            return Ok(jsonResponse);
        }
    }

    public class PaymentRequest
    {
        public decimal Amount { get; set; }
    }
}
