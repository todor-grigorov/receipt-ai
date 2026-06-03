namespace ReceiptAI.Application.DataTransferObjects.Responses
{
    public record ReceiptLineItemResponse(
        Guid Id,
        string Description,
        int Quantity,
        decimal UnitPrice,
        decimal TotalPrice
    );
}
