using ReceiptAI.Domain.Entities;

namespace ReceiptAI.Application.Interfaces.Repositories
{
    public interface IReceiptRepository
    {
        Task<Receipt?> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<Receipt?> GetByJobIdAsync(Guid jobId, CancellationToken ct = default);
        Task<IEnumerable<Receipt>> GetByUserIdAsync(string userId, int page, int pageSize, CancellationToken ct = default);
        Task<int> CountByUserIdAsync(string userId, CancellationToken ct = default);
        Task AddAsync(Receipt receipt, CancellationToken ct = default);
        Task DeleteAsync(Guid id, CancellationToken ct = default);
    }
}
