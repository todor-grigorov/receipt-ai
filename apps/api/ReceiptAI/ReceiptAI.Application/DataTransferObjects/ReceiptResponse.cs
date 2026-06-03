namespace ReceiptAI.Application.DataTransferObjects
{
    public record ReceiptResponse(
    Guid Id,
    Guid JobId,
    string MerchantName,
    DateOnly? ReceiptDate,
    decimal Total,
    decimal? Tax,
    string? Currency,
    IEnumerable<ReceiptLineItemResponse> LineItems,
    DateTimeOffset CreatedAt
);
}
