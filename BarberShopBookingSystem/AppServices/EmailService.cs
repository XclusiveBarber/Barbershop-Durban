using Resend;

namespace BarberShopBookingSystem.Services
{
    public interface IEmailService
    {
        Task SendCancellationEmail(string customerEmail, string date, string time);
    }

    public class EmailService : IEmailService
    {
        private readonly IResend _resend;

        public EmailService(IResend resend)
        {
            _resend = resend;
        }

        public async Task SendCancellationEmail(string customerEmail, string date, string time)
        {
            var message = new EmailMessage();

            // IMPORTANT: This must be a domain you have verified in your Resend dashboard
            message.From = "bookings@yourbarbershop.com";

            message.To.Add(customerEmail);
            message.Subject = "Appointment Cancellation Update";

            // The HTML body of the email
            message.HtmlBody = $@"
                <div style='font-family: Arial, sans-serif; color: #333;'>
                    <h2>Appointment Cancelled</h2>
                    <p>Hi there,</p>
                    <p>Unfortunately, your appointment on <strong>{date}</strong> at <strong>{time}</strong> has been cancelled as the barber is no longer available.</p>
                    <p>We apologize for the inconvenience. Please log in to the app to book a new slot.</p>
                    <br/>
                    <p>Best regards,</p>
                    <p><strong>The Shop</strong></p>
                </div>";

            await _resend.EmailSendAsync(message);
        }
    }
}