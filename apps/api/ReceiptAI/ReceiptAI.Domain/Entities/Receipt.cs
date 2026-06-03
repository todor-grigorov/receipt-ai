namespace ReceiptAI.Domain.Entities
{
    public class Receipt : BaseEntity
    {
        public Guid JobId { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string MerchantName { get; set; } = string.Empty;
        public DateOnly? ReceiptDate { get; set; }
        public decimal Total { get; set; }
        public decimal? Tax { get; set; }
        public string? Currency { get; set; }
        public string RawLlmResponse { get; set; } = string.Empty;

        // Navigation
        public Job Job { get; set; } = null!;
        public ICollection<ReceiptLineItem> LineItems { get; set; } = [];
    }
}
