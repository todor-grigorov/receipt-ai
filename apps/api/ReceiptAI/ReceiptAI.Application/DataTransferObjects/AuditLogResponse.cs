using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Application.DataTransferObjects
{
    public record AuditLogResponse(
        Guid Id,
        Guid CorrelationId,
        AuditEventType EventType,
        string Service,
        string? Actor,
        string? Payload,
        bool IsSuccess,
        string? ErrorMessage,
        DateTimeOffset CreatedAt
    );
}
