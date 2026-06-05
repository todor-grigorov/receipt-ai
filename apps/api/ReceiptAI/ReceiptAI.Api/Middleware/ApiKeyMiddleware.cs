namespace ReceiptAI.Api.Middleware
{
    public class ApiKeyMiddleware(
     RequestDelegate next,
     IConfiguration configuration,
     ILogger<ApiKeyMiddleware> logger)
    {
        private const string ApiKeyHeaderName = "X-Api-Key";

        public async Task InvokeAsync(HttpContext context)
        {
            // Only protect internal endpoints
            if (!context.Request.Path.StartsWithSegments("/api/internal"))
            {
                await next(context);
                return;
            }

            if (!context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var apiKey))
            {
                logger.LogWarning("API key missing on internal endpoint: {Path}",
                    context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new ErrorResponse(
                    StatusCodes.Status401Unauthorized,
                    "API key is missing"));
                return;
            }

            var validApiKey = configuration["InternalApi:ApiKey"];

            if (!apiKey.Equals(validApiKey))
            {
                logger.LogWarning("Invalid API key attempt on internal endpoint: {Path}",
                    context.Request.Path);

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new ErrorResponse(
                    StatusCodes.Status403Forbidden,
                    "Invalid API key"));
                return;
            }

            await next(context);
        }
    }
}
