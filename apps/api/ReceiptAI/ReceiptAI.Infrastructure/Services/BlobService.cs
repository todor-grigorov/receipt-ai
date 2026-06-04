using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using ReceiptAI.Application.Interfaces.Services;

namespace ReceiptAI.Infrastructure.Services
{
    public class BlobService(BlobServiceClient blobServiceClient) : IBlobService
    {
        private const string ContainerName = "receipts";

        public async Task<string> UploadAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            string userId,
            Guid correlationId,
            CancellationToken ct = default)
        {
            var containerClient = blobServiceClient
                .GetBlobContainerClient(ContainerName);

            await containerClient.CreateIfNotExistsAsync(
                PublicAccessType.None,
                cancellationToken: ct);

            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var blobName = $"{userId}/{correlationId}{extension}";
            var blobClient = containerClient.GetBlobClient(blobName);

            await blobClient.UploadAsync(
                fileStream,
                new BlobHttpHeaders { ContentType = contentType },
                cancellationToken: ct);

            return GenerateSasUrl(blobClient);
        }

        public async Task DeleteAsync(string blobUrl, CancellationToken ct = default)
        {
            var blobName = ExtractBlobName(blobUrl);

            var containerClient = blobServiceClient
                .GetBlobContainerClient(ContainerName);

            var blobClient = containerClient.GetBlobClient(blobName);

            await blobClient.DeleteIfExistsAsync(cancellationToken: ct);
        }

        private static string GenerateSasUrl(BlobClient blobClient)
        {
            var sasUri = blobClient.GenerateSasUri(
                BlobSasPermissions.Read,
                DateTimeOffset.UtcNow.AddHours(1));

            return sasUri.ToString();
        }

        private static string ExtractBlobName(string blobUrl)
        {
            // Handles both plain URLs and SAS URLs
            // e.g. https://storage.blob.core.windows.net/receipts/userId/correlationId.pdf?sv=...
            var uri = new Uri(blobUrl);
            var path = uri.AbsolutePath;

            // Remove the container name prefix from the path
            // AbsolutePath = /receipts/userId/correlationId.pdf
            var containerPrefix = $"/{ContainerName}/";
            return path.StartsWith(containerPrefix)
                ? path[containerPrefix.Length..]
                : path.TrimStart('/');
        }
    }
    class BlobService
    {
    }
}
