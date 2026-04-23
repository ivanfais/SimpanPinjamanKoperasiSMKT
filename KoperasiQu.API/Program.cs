using System.Text;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using KoperasiQu.API.Application.Interfaces;
using KoperasiQu.API.Application.Services;
using KoperasiQu.API.Domain.Interfaces;
using KoperasiQu.API.Infrastructure;
using KoperasiQu.API.Infrastructure.Persistence;
using KoperasiQu.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ── Database ─────────────────────────────────────────────────
var connStr = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseMySql(connStr, ServerVersion.AutoDetect(connStr)));

// ── Repository & Unit of Work (Infrastructure) ──────────────
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ── Application Services ──────────────────────────────────────
builder.Services.AddScoped<ILoanService,       LoanService>();
builder.Services.AddScoped<IMemberService,     MemberService>();
builder.Services.AddScoped<IAuthService,       AuthService>();
builder.Services.AddScoped<IMemberAuthService, MemberAuthService>();

// ── Hosted Services (Background Workers) ──────────────────────
builder.Services.AddHostedService<PenaltyBackgroundService>();

// ── FluentValidation ──────────────────────────────────────────
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

// ── JWT Authentication ────────────────────────────────────────
var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSection["Issuer"],
            ValidAudience            = jwtSection["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSection["Key"]!))
        };
    });

builder.Services.AddAuthorization();

// ── Controllers ───────────────────────────────────────────────
builder.Services.AddControllers();

// ── Swagger ───────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title       = "KoperasiQu API",
        Version     = "v1",
        Description = "REST API untuk sistem pinjaman anggota KoperasiQu"
    });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In          = ParameterLocation.Header,
        Name        = "Authorization",
        Type        = SecuritySchemeType.ApiKey,
        Scheme      = "Bearer",
        Description = "Masukkan: Bearer {token}"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            []
        }
    });
});

// ── CORS ──────────────────────────────────────────────────────
// Development: izinkan semua origin agar Expo Go di HP bisa akses
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.AllowAnyOrigin()
     .AllowAnyHeader()
     .AllowAnyMethod()));

var app = builder.Build();

// ── Middleware Pipeline ───────────────────────────────────────
app.UseMiddleware<ExceptionHandlerMiddleware>();
app.UseStaticFiles(); // Untuk menyajikan folder wwwroot/uploads
app.UseCors();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "KoperasiQu API v1");
    c.RoutePrefix = string.Empty;
});

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── Auto Migrate & Seed ───────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

app.Run();
