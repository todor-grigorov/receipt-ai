namespace ReceiptAI.Domain.Entities
{
    public class ReceiptLineItem : BaseEntity
    {
        public Guid ReceiptId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }

        // Navigation
        public Receipt Receipt { get; set; } = null!;
    }
}
