using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Application.DataTransferObjects.Responses;

namespace ReceiptAI.Application.Interfaces.Services
{
    public interface IReceiptService
    {
        Task<ReceiptResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<ReceiptResponse> GetByJobIdAsync(Guid jobId, CancellationToken ct = default);
        Task<IEnumerable<ReceiptResponse>> GetByUserIdAsync(string userId, int page, int pageSize, CancellationToken ct = default);
        Task<int> CountByUserIdAsync(string userId, CancellationToken ct = default);
        Task<ReceiptResponse> UploadAsync(UploadReceiptRequest request, CancellationToken ct = default);
        Task DeleteAsync(Guid id, CancellationToken ct = default);
    }
}
