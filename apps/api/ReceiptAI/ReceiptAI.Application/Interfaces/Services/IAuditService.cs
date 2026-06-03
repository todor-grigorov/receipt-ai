using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Application.Interfaces.Services
{
    public interface IAuditService
    {
        Task LogAsync(
            Guid correlationId,
            AuditEventType eventType,
            string service,
            string? actor = null,
            object? payload = null,
            bool isSuccess = true,
            string? errorMessage = null,
            CancellationToken ct = default);

        Task<IEnumerable<AuditLog>> GetTrailAsync(Guid correlationId, CancellationToken ct = default);
    }
}
