using BarberShopBookingSystem.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Resend; // Added for the Resend email client
using BarberShopBookingSystem.Services; // Added to locate your new EmailService

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions =>
        {
            // Keeps your connection stable on South African networks
            npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(2), null);
        })
    .UseSnakeCaseNamingConvention(); // This fixes the 'column b.Id does not exist' error
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Supabase:Url"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Supabase:Url"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Supabase:ClientId"], // Supabase anon/public key
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Supabase:JwtSecret"])
            )
        };
    });

builder.Services.AddAuthorization();

// Add CORS services
// FRONTEND_URL can be a single URL or comma-separated list e.g. "https://myapp.vercel.app,https://mycustomdomain.co.za"
var allowedOrigins = new List<string> { "http://localhost:3000", "http://localhost:5173" };
var frontendUrl = builder.Configuration["FRONTEND_URL"];
if (!string.IsNullOrEmpty(frontendUrl))
    allowedOrigins.AddRange(frontendUrl.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins(allowedOrigins.ToArray())
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

// --- NEW NOTIFICATION SYSTEM REGISTRATION ---
builder.Services.AddOptions();
builder.Services.AddHttpClient<ResendClient>();
builder.Services.Configure<ResendClientOptions>(options =>
{
    // This pulls the key directly from your appsettings.json
    options.ApiToken = builder.Configuration["Resend:ApiKey"];
});
builder.Services.AddTransient<IResend, ResendClient>();

// Registers your custom email service so the controller can use it
builder.Services.AddTransient<IEmailService, EmailService>();
// --------------------------------------------
// --------------------------------------------

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");
app.UseHttpsRedirection();
app.UseAuthentication(); // must be before UseAuthorization
app.UseAuthorization();
app.MapControllers();
app.Run();

// adding comments to tets git push and pull request functionality