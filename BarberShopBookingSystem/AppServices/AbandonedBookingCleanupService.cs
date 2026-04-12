using BarberShopBookingSystem.Data;
using Microsoft.EntityFrameworkCore;

namespace BarberShopBookingSystem.Services
{
    /// <summary>
    /// Background service that cancels pending unpaid bookings older than 10 minutes.
    /// Runs every 2 minutes so abandoned bookings never hoard slots for long.
    /// </summary>
    public class AbandonedBookingCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AbandonedBookingCleanupService> _logger;
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(2);
        private static readonly TimeSpan ExpiryThreshold = TimeSpan.FromMinutes(10);

        public AbandonedBookingCleanupService(IServiceScopeFactory scopeFactory, ILogger<AbandonedBookingCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during abandoned booking cleanup");
                }

                await Task.Delay(Interval, stoppingToken);
            }
        }

        private async Task CleanupAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var localTimeNow = DateTime.UtcNow.AddHours(2);
            var expiryTime = localTimeNow - ExpiryThreshold;

            // This executes a single SQL query directly on the database:
            // UPDATE appointments SET status = 'cancelled' WHERE ...
            var cancelledCount = await context.Appointments
                .Where(a => a.Status == "pending" && a.PaymentStatus == "unpaid" && a.CreatedAt < expiryTime)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Status, "cancelled"));

            if (cancelledCount > 0)
            {
                _logger.LogInformation("Cancelled {Count} abandoned pending bookings", cancelledCount);
            }
        }
    }
}
