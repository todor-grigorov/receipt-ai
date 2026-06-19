using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Domain.Entities
{
    public class Job : BaseEntity
    {
        public Guid CorrelationId { get; set; } = Guid.NewGuid();
        public string UserId { get; set; } = string.Empty;
        public JobStatus Status { get; set; } = JobStatus.Pending;
        public string BlobUrl { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }

        // Navigation
        public Receipt? Receipt { get; set; }
    }
}
