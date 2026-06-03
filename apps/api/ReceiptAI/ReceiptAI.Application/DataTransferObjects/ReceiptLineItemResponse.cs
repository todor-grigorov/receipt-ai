namespace ReceiptAI.Application.DataTransferObjects
{
    public record ReceiptLineItemResponse(
        Guid Id,
        string Description,
        int Quantity,
        decimal UnitPrice,
        decimal TotalPrice
    );
}
