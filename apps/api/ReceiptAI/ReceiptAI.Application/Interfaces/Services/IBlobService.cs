namespace ReceiptAI.Application.Interfaces.Services
{
    public interface IBlobService
    {
        Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken ct = default);
        Task DeleteAsync(string blobUrl, CancellationToken ct = default);
    }
}
