using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Domain.Constants;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Domain.Exceptions;

namespace ReceiptAI.Application.Services
{
    public class ReceiptService(
    IReceiptRepository receiptRepository,
    IJobService jobService,
    IBlobService blobService,
    IAuditService auditService,
    ICurrentUserService currentUser) : IReceiptService
    {
        public async Task<ReceiptResponse> GetByIdAsync(
            Guid id,
            CancellationToken ct = default)
        {
            var receipt = await receiptRepository.GetByIdAsync(id, ct)
                ?? throw new NotFoundException($"Receipt {id} not found");

            if (receipt.UserId != currentUser.UserId)
                throw new UnauthorizedException("Access denied");

            await auditService.LogAsync(
                receipt.JobId,
                AuditEventType.ResultRetrieved,
                service: ServiceNames.Api,
                actor: $"user:{currentUser.UserId}",
                ct: ct);

            return MapToResponse(receipt);
        }

        public async Task<ReceiptResponse> GetByJobIdAsync(
            Guid jobId,
            CancellationToken ct = default)
        {
            var receipt = await receiptRepository.GetByJobIdAsync(jobId, ct)
                ?? throw new NotFoundException($"Receipt for job {jobId} not found");

            if (receipt.UserId != currentUser.UserId)
                throw new UnauthorizedException("Access denied");

            return MapToResponse(receipt);
        }

        public async Task<IEnumerable<ReceiptResponse>> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            var receipts = await receiptRepository.GetByUserIdAsync(userId, page, pageSize, ct);
            return receipts.Select(MapToResponse);
        }

        public async Task<ReceiptResponse> UploadAsync(
            UploadReceiptRequest request,
            CancellationToken ct = default)
        {
            var correlationId = Guid.NewGuid();

            await auditService.LogAsync(
                correlationId,
                AuditEventType.ReceiptUploaded,
                service: ServiceNames.Api,
                actor: $"user:{currentUser.UserId}",
                payload: new
                {
                    request.FileName,
                    request.ContentType,
                    request.FileSizeBytes
                },
                ct: ct);

            var blobUrl = await blobService.UploadAsync(
                request.FileStream,
                request.FileName,
                request.ContentType,
                ct);

            await auditService.LogAsync(
                correlationId,
                AuditEventType.BlobStored,
                service: ServiceNames.Api,
                actor: $"user:{currentUser.UserId}",
                payload: new { blobUrl },
                ct: ct);

            await jobService.CreateAsync(
                correlationId,
                currentUser.UserId,
                blobUrl,
                ct);

            // Return a pending response — the actual receipt result
            // arrives later via SignalR when the Azure Function completes
            return new ReceiptResponse(
                Id: Guid.Empty,
                JobId: correlationId,
                MerchantName: string.Empty,
                ReceiptDate: null,
                Total: 0,
                Tax: null,
                Currency: null,
                LineItems: [],
                CreatedAt: DateTimeOffset.UtcNow);
        }

        public async Task DeleteAsync(Guid id, CancellationToken ct = default)
        {
            var receipt = await receiptRepository.GetByIdAsync(id, ct)
                ?? throw new NotFoundException($"Receipt {id} not found");

            if (receipt.UserId != currentUser.UserId)
                throw new UnauthorizedException("Access denied");

            await blobService.DeleteAsync(receipt.Job.BlobUrl, ct);
            await receiptRepository.DeleteAsync(id, ct);
        }

        private static ReceiptResponse MapToResponse(Domain.Entities.Receipt receipt) => new(
            receipt.Id,
            receipt.JobId,
            receipt.MerchantName,
            receipt.ReceiptDate,
            receipt.Total,
            receipt.Tax,
            receipt.Currency,
            receipt.LineItems.Select(li => new ReceiptLineItemResponse(
                li.Id,
                li.Description,
                li.Quantity,
                li.UnitPrice,
                li.TotalPrice)),
            receipt.CreatedAt);
    }
}
