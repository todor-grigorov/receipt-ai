using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Application.DataTransferObjects.Requests
{
    public record NotifyJobRequest(
    Guid CorrelationId,
    JobStatus Status,
    Guid? ResultId,
    string? ErrorMessage
    );
}
