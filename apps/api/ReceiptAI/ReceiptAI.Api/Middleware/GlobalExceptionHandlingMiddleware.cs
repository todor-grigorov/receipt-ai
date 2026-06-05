using ReceiptAI.Domain.Exceptions;
using System.Net;
using System.Text.Json;

namespace ReceiptAI.Api.Middleware
{
    public class GlobalExceptionHandlingMiddleware(RequestDelegate next,
    ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(
            HttpContext context,
            Exception exception)
        {
            context.Response.ContentType = "application/json";

            var (statusCode, message, errors) = exception switch
            {
                NotFoundException ex => (
                    HttpStatusCode.NotFound,
                    ex.Message,
                    (IDictionary<string, string[]>?)null),

                UnauthorizedException ex => (
                    HttpStatusCode.Forbidden,
                    ex.Message,
                    (IDictionary<string, string[]>?)null),

                ValidationException ex => (
                    HttpStatusCode.UnprocessableEntity,
                    ex.Message,
                    (IDictionary<string, string[]>?)ex.Errors),

                ConflictException ex => (
                    HttpStatusCode.Conflict,
                    ex.Message,
                    (IDictionary<string, string[]>?)null),

                _ => (
                    HttpStatusCode.InternalServerError,
                    "An unexpected error occurred",
                    (IDictionary<string, string[]>?)null)
            };

            context.Response.StatusCode = (int)statusCode;

            var response = new ErrorResponse(
                (int)statusCode,
                message,
                errors);

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(response,
                    new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    }));
        }
    }
}
