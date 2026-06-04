using Microsoft.EntityFrameworkCore;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Domain.Entities;

namespace ReceiptAI.Infrastructure.Persistence.Repositories
{
    public class AuditLogRepository(AppDbContext context)
    : RepositoryBase<AuditLog>(context), IAuditLogRepository
    {
        public async Task<IEnumerable<AuditLog>> GetByCorrelationIdAsync(
            Guid correlationId,
            CancellationToken ct = default) =>
            await FindByCondition(a => a.CorrelationId == correlationId, trackChanges: false)
                .OrderBy(a => a.CreatedAt)
                .ToListAsync(ct);

        public async Task AddAsync(AuditLog auditLog, CancellationToken ct = default)
        {
            Create(auditLog);
            await context.SaveChangesAsync(ct);
        }
    }
}
