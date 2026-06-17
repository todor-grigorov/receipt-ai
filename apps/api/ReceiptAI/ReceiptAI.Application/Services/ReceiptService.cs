using AutoMapper;
using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Domain.Constants;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Domain.Exceptions;
using System.Transactions;

namespace ReceiptAI.Application.Services
{
    public class ReceiptService(
        IRepositoryManager repository,
        IJobService jobService,
        IAuditService auditService,
        IBlobService blobService,
        ICurrentUserService currentUser,
        IMapper mapper) : IReceiptService
    {
        public async Task<ReceiptResponse> GetByIdAsync(Guid id, CancellationToken ct = default)
        {
            var receipt = await repository.Receipt.GetByIdAsync(id, ct)
                ?? throw new NotFoundException($"Receipt {id} not found");

            if (receipt.UserId != currentUser.UserId)
                throw new UnauthorizedException("Access denied");

            var sasUrl = await blobService.GenerateSasUrlAsync(receipt.Job.BlobUrl, ct);

            await auditService.LogAsync(
                receipt.JobId,
                AuditEventType.ResultRetrieved,
                service: ServiceNames.Api,
                actor: $"user:{currentUser.UserId}",
                ct: ct);

            var response = mapper.Map<ReceiptResponse>(receipt);
            return response with { BlobUrl = sasUrl };
        }

        public async Task<ReceiptResponse> GetByJobIdAsync(
            Guid jobId,
            CancellationToken ct = default)
        {
            var receipt = await repository.Receipt.GetByJobIdAsync(jobId, ct)
                ?? throw new NotFoundException(
                    $"Receipt for job {jobId} not found");

            if (receipt.UserId != currentUser.UserId)
                throw new UnauthorizedException("Access denied");

            return mapper.Map<ReceiptResponse>(receipt);
        }

        public async Task<IEnumerable<ReceiptResponse>> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            CancellationToken ct = default)
        {
            var receipts = await repository.Receipt
                .GetByUserIdAsync(userId, page, pageSize, ct);

            return mapper.Map<IEnumerable<ReceiptResponse>>(receipts);
        }

        public async Task<int> CountByUserIdAsync(
            string userId,
            CancellationToken ct = default) =>
            await repository.Receipt.CountByUserIdAsync(userId, ct);

        public async Task<ReceiptResponse> UploadAsync(
            UploadReceiptRequest request,
            CancellationToken ct = default)
        {
            var correlationId = Guid.NewGuid();

            var blobUrl = await blobService.UploadAsync(
                request.FileStream,
                request.FileName,
                request.ContentType,
                currentUser.UserId,
                correlationId,
                ct);

            using var scope = new TransactionScope(
                TransactionScopeOption.Required,
                new TransactionOptions
                {
                    IsolationLevel = IsolationLevel.ReadCommitted
                },
                TransactionScopeAsyncFlowOption.Enabled);

            try
            {
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

                scope.Complete();
            }
            catch
            {
                await blobService.DeleteAsync(blobUrl, ct);
                throw;
            }

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
            var receipt = await repository.Receipt.GetByIdAsync(id, ct)
                ?? throw new NotFoundException($"Receipt {id} not found");

            if (receipt.UserId != currentUser.UserId)
                throw new UnauthorizedException("Access denied");

            await blobService.DeleteAsync(receipt.Job.BlobUrl, ct);
            await repository.Receipt.DeleteAsync(id, ct);
        }
    }
}
