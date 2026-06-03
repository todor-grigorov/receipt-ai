using ReceiptAI.Application.DataTransferObjects;

namespace ReceiptAI.Application.Interfaces.Services
{
    public interface IReceiptService
    {
        Task<ReceiptResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<ReceiptResponse> GetByJobIdAsync(Guid jobId, CancellationToken ct = default);
        Task<IEnumerable<ReceiptResponse>> GetByUserIdAsync(string userId, int page, int pageSize, CancellationToken ct = default);
        Task<ReceiptResponse> UploadAsync(UploadReceiptRequest request, CancellationToken ct = default);
        Task DeleteAsync(Guid id, CancellationToken ct = default);
    }
}
