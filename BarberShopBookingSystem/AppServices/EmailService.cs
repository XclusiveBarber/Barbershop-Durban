using System.Net.Http.Headers;
using System.Text.Json;

namespace BarberShopBookingSystem.Services
{
    public interface IEmailService
    {
        Task SendCancellationEmail(string customerEmail, string date, string time);
        Task SendSelfCancellationEmail(string customerEmail, string date, string time);
        Task SendBookingConfirmationEmail(string customerEmail, string date, string time, string services, string barberName, string totalPrice);
        Task SendRescheduleEmail(string customerEmail, string newDate, string newTime, string services, string barberName);
        Task SendWelcomeEmail(string customerEmail, string fullName);
    }

    public class EmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public EmailService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        private async Task SendEmail<T>(string type, string to, string subject, T payload)
        {
            var nextJsUrl = _config["NextJs:ApiUrl"]?.TrimEnd('/') + "/api/emails/send";
            var secret = _config["NextJs:InternalSecret"];

            var requestBody = new { type, to, subject, payload };
            var json = JsonSerializer.Serialize(requestBody);
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, nextJsUrl)
            {
                Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
            };
            requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secret);

            await _httpClient.SendAsync(requestMessage);
        }

        public Task SendCancellationEmail(string customerEmail, string date, string time)
        {
            return SendEmail(
                type: "CANCELLATION",
                to: customerEmail,
                subject: "Appointment Cancellation Update",
                payload: new { date, time }
            );
        }

        public Task SendBookingConfirmationEmail(
            string customerEmail,
            string date,
            string time,
            string services,
            string barberName,
            string totalPrice)
        {
            return SendEmail(
                type: "BOOKING_CONFIRMATION",
                to: customerEmail,
                subject: "Booking Confirmed — Xclusive Barber",
                payload: new { date, time, services, barberName, totalPrice }
            );
        }

        public Task SendSelfCancellationEmail(string customerEmail, string date, string time)
        {
            return SendEmail(
                type: "SELF_CANCELLATION",
                to: customerEmail,
                subject: "Your Appointment Has Been Cancelled",
                payload: new { date, time }
            );
        }

        public Task SendRescheduleEmail(string customerEmail, string newDate, string newTime, string services, string barberName)
        {
            return SendEmail(
                type: "RESCHEDULE",
                to: customerEmail,
                subject: "Appointment Rescheduled — Xclusive Barber",
                payload: new { newDate, newTime, services, barberName }
            );
        }

        public Task SendWelcomeEmail(string customerEmail, string fullName)
        {
            return SendEmail(
                type: "WELCOME",
                to: customerEmail,
                subject: "Welcome to Xclusive Barber!",
                payload: new { fullName }
            );
        }
    }
}
