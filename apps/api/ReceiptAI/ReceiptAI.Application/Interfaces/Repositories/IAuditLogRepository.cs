using ReceiptAI.Domain.Entities;

namespace ReceiptAI.Application.Interfaces.Repositories
{
    public interface IAuditLogRepository
    {
        Task<IEnumerable<AuditLog>> GetByCorrelationIdAsync(Guid correlationId, CancellationToken ct = default);
        Task AddAsync(AuditLog auditLog, CancellationToken ct = default);
    }
}
