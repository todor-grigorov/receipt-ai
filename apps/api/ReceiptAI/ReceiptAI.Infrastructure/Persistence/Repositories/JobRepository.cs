using Microsoft.EntityFrameworkCore;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Infrastructure.Persistence.Repositories
{
    public class JobRepository(AppDbContext context)
    : RepositoryBase<Job>(context), IJobRepository
    {
        public async Task<Job?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            await FindByCondition(j => j.Id == id, trackChanges: false)
                .Include(j => j.Receipt)
                .FirstOrDefaultAsync(ct);

        public async Task<Job?> GetByCorrelationIdAsync(Guid correlationId, CancellationToken ct = default) =>
            await FindByCondition(j => j.CorrelationId == correlationId, trackChanges: false)
                .Include(j => j.Receipt)
                .FirstOrDefaultAsync(ct);

        public async Task<IEnumerable<Job>> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            JobStatus? statusFilter = null,
            CancellationToken ct = default)
        {
            var query = FindByCondition(j => j.UserId == userId, trackChanges: false);

            if (statusFilter.HasValue)
                query = query.Where(j => j.Status == statusFilter.Value);

            return await query
                .OrderByDescending(j => j.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(j => j.Receipt)
                .ToListAsync(ct);
        }

        public async Task<int> CountByUserIdAsync(
            string userId,
            JobStatus? statusFilter = null,
            CancellationToken ct = default)
        {
            var query = FindByCondition(j => j.UserId == userId, trackChanges: false);

            if (statusFilter.HasValue)
                query = query.Where(j => j.Status == statusFilter.Value);

            return await query.CountAsync(ct);
        }

        public async Task AddAsync(Job job, CancellationToken ct = default)
        {
            Create(job);
            await context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(Job job, CancellationToken ct = default)
        {
            Update(job);
            await context.SaveChangesAsync(ct);
        }

        public async Task DeleteAsync(Guid id, CancellationToken ct = default)
        {
            var job = await FindByCondition(j => j.Id == id, trackChanges: true)
                .FirstOrDefaultAsync(ct);

            if (job is not null)
            {
                Delete(job);
                await context.SaveChangesAsync(ct);
            }
        }
    }
}
