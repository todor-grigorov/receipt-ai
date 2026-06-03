using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Application.DataTransferObjects
{
    public record NotifyJobRequest(
    Guid CorrelationId,
    JobStatus Status,
    Guid? ResultId,
    string? ErrorMessage
    );
}
