using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Application.DataTransferObjects.Responses
{
    public record JobStatusResponse(
     Guid Id,
     Guid CorrelationId,
     JobStatus Status,
     string? ErrorMessage,
     Guid? ResultId,
     DateTimeOffset CreatedAt,
     DateTimeOffset UpdatedAt
 );
}
