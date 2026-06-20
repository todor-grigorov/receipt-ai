using Microsoft.EntityFrameworkCore;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Domain.Entities;


namespace ReceiptAI.Infrastructure.Persistence.Repositories
{
    public class ReceiptRepository(AppDbContext context)
    : RepositoryBase<Receipt>(context), IReceiptRepository
    {
        public async Task<Receipt?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            await FindByCondition(r => r.Id == id, trackChanges: false)
                .Include(r => r.LineItems)
                .Include(r => r.Job)
                .FirstOrDefaultAsync(ct);

        public async Task<Receipt?> GetByCorrelationIdAsync(Guid correlationId, CancellationToken ct = default) =>
            await FindByCondition(r => r.CorrelationId == correlationId, trackChanges: false)
                .Include(r => r.LineItems)
                .FirstOrDefaultAsync(ct);

        public async Task<IEnumerable<Receipt>> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default) =>
            await FindByCondition(r => r.UserId == userId, trackChanges: false)
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(r => r.LineItems)
                .ToListAsync(ct);

        public async Task<int> CountByUserIdAsync(
            string userId,
            CancellationToken ct = default) =>
            await FindByCondition(r => r.UserId == userId, trackChanges: false)
                .CountAsync(ct);

        public async Task AddAsync(Receipt receipt, CancellationToken ct = default)
        {
            Create(receipt);
            await context.SaveChangesAsync(ct);
        }

        public async Task DeleteAsync(Guid id, CancellationToken ct = default)
        {
            var receipt = await FindByCondition(r => r.Id == id, trackChanges: true)
                .FirstOrDefaultAsync(ct);

            if (receipt is not null)
            {
                Delete(receipt);
                await context.SaveChangesAsync(ct);
            }
        }
    }
}