using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Application.Interfaces.Repositories
{
    public interface IJobRepository
    {
        Task<Job?> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<Job?> GetByCorrelationIdAsync(Guid correlationId, CancellationToken ct = default);
        Task<IEnumerable<Job>> GetByUserIdAsync(string userId, int page, int pageSize, JobStatus? statusFilter = null, CancellationToken ct = default);
        Task<int> CountByUserIdAsync(string userId, JobStatus? statusFilter = null, CancellationToken ct = default);
        Task AddAsync(Job job, CancellationToken ct = default);
        Task UpdateAsync(Job job, CancellationToken ct = default);
        Task DeleteAsync(Guid id, CancellationToken ct = default);
    }
}
