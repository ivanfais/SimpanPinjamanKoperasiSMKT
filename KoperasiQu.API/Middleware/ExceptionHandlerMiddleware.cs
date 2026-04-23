using System.Text.Json;
using FluentValidation;
using KoperasiQu.API.Domain.Exceptions;

namespace KoperasiQu.API.Middleware;

/// <summary>
/// Global exception handler — satu titik konversi exception ke HTTP response.
/// Dipindahkan ke Presentation layer (di sini tetap di Middleware karena konvensi ASP.NET).
/// </summary>
public class ExceptionHandlerMiddleware(RequestDelegate next, ILogger<ExceptionHandlerMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception at {Path}: {Message}",
                context.Request.Path, ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext ctx, Exception ex)
    {
        // Validation errors (FluentValidation)
        if (ex is ValidationException validationEx)
        {
            ctx.Response.ContentType = "application/json";
            ctx.Response.StatusCode  = 400;
            var errors = validationEx.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            return ctx.Response.WriteAsync(JsonSerializer.Serialize(new
            {
                status  = 400,
                title   = "Validation Failed",
                errors,
                traceId = ctx.TraceIdentifier
            }));
        }

        // Domain / Business rule exceptions
        var (code, title) = ex switch
        {
            CreditLimitExceededException => (422, "Credit Limit Exceeded"),
            ActiveLoanExistsException    => (409, "Active Loan Exists"),
            InvalidLoanStateException    => (409, "Invalid Loan State"),
            MemberInactiveException      => (403, "Member Inactive"),
            DomainException              => (422, "Business Rule Violation"),
            UnauthorizedAccessException  => (401, "Unauthorized"),
            KeyNotFoundException         => (404, "Not Found"),
            _                            => (500, "Internal Server Error")
        };

        ctx.Response.ContentType = "application/json";
        ctx.Response.StatusCode  = code;

        return ctx.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            status  = code,
            title,
            detail  = ex.Message,
            traceId = ctx.TraceIdentifier
        }));
    }
}
