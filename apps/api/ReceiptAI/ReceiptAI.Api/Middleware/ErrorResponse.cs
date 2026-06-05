namespace ReceiptAI.Api.Middleware
{
    public record ErrorResponse(
        int StatusCode,
        string Message,
        IDictionary<string, string[]>? Errors = null
    );
}
