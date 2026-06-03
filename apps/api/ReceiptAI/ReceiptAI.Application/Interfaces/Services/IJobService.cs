using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Application.Interfaces.Services
{
    public interface IJobService
    {
        Task<JobStatusResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<IEnumerable<JobStatusResponse>> GetByUserIdAsync(string userId, int page, int pageSize, JobStatus? statusFilter = null, CancellationToken ct = default);
        Task<JobStatusResponse> CreateAsync(Guid correlationId, string userId, string blobUrl, CancellationToken ct = default);
        Task<JobStatusResponse> UpdateStatusAsync(Guid correlationId, JobStatus status, string? errorMessage = null, CancellationToken ct = default);
    }
}
