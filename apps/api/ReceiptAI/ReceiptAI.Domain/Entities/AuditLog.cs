using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Domain.Entities
{
    public class AuditLog : BaseEntity
    {
        public Guid CorrelationId { get; set; }
        public AuditEventType EventType { get; set; }
        public string Service { get; set; } = string.Empty;
        public string? Actor { get; set; }
        public string? Payload { get; set; }        // JSON string
        public bool IsSuccess { get; set; } = true;
        public string? ErrorMessage { get; set; }
    }
}
