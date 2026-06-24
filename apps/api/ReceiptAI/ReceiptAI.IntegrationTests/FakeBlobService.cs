using ReceiptAI.Application.Interfaces.Services;

namespace ReceiptAI.IntegrationTests
{
    public class FakeBlobService : IBlobService
    {
        public Task<string> UploadAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            string userId,
            Guid correlationId,
            CancellationToken ct = default)
        {
            return Task.FromResult($"https://fake-storage.test/receipts/{userId}/{correlationId}.jpg?fake-sas-token");
        }

        public Task<string> GenerateSasUrlAsync(string blobUrl, CancellationToken ct = default)
        {
            return Task.FromResult($"{blobUrl}&refreshed=true");
        }

        public Task DeleteAsync(string blobUrl, CancellationToken ct = default)
        {
            return Task.CompletedTask;
        }
    }
}
