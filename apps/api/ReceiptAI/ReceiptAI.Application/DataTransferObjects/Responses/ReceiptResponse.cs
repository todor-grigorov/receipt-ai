namespace ReceiptAI.Application.DataTransferObjects.Responses
{
    public record ReceiptResponse(
        Guid Id,
        Guid CorrelationId,
        string MerchantName,
        DateOnly? ReceiptDate,
        decimal Total,
        decimal? Tax,
        string? Currency,
        string? BlobUrl,
        IEnumerable<ReceiptLineItemResponse> LineItems,
        DateTimeOffset CreatedAt
    );
}