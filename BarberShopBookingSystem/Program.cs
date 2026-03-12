using BarberShopBookingSystem.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
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
        var supabaseUrl = builder.Configuration["Supabase:Url"];
        var issuer = $"{supabaseUrl}/auth/v1"; // Supabase JWTs use /auth/v1 as the issuer

        // Supabase uses ES256 (asymmetric elliptic curve) for JWT signing.
        // Fetch EC public keys directly from the JWKS endpoint at startup —
        // more reliable on Azure than OIDC metadata discovery.
        var jwksJson = new HttpClient()
            .GetStringAsync($"{issuer}/.well-known/jwks.json")
            .GetAwaiter().GetResult();
        var signingKeys = new Microsoft.IdentityModel.Tokens.JsonWebKeySet(jwksJson).GetSigningKeys();

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = signingKeys,
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
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