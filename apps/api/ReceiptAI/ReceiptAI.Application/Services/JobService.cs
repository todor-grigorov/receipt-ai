using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Domain.Constants;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using ReceiptAI.Domain.Exceptions;

namespace ReceiptAI.Application.Services
{
    public class JobService(
    IJobRepository jobRepository,
    IAuditService auditService) : IJobService
    {
        public async Task<JobStatusResponse> GetByIdAsync(
            Guid id,
            CancellationToken ct = default)
        {
            var job = await jobRepository.GetByIdAsync(id, ct)
                ?? throw new NotFoundException($"Job {id} not found");

            return MapToResponse(job);
        }

        public async Task<IEnumerable<JobStatusResponse>> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            JobStatus? statusFilter = null,
            CancellationToken ct = default)
        {
            var jobs = await jobRepository.GetByUserIdAsync(userId, page, pageSize, statusFilter, ct);
            return jobs.Select(MapToResponse);
        }

        public async Task<JobStatusResponse> CreateAsync(
            Guid correlationId,
            string userId,
            string blobUrl,
            CancellationToken ct = default)
        {
            var job = new Job
            {
                CorrelationId = correlationId,
                UserId = userId,
                BlobUrl = blobUrl,
                Status = JobStatus.Pending
            };

            await jobRepository.AddAsync(job, ct);

            await auditService.LogAsync(
                correlationId,
                AuditEventType.JobCreated,
                service: ServiceNames.Api,
                actor: $"user:{userId}",
                payload: new { blobUrl },
                ct: ct);

            return MapToResponse(job);
        }

        public async Task<JobStatusResponse> UpdateStatusAsync(
            Guid correlationId,
            JobStatus status,
            string? errorMessage = null,
            CancellationToken ct = default)
        {
            var job = await jobRepository.GetByCorrelationIdAsync(correlationId, ct)
                ?? throw new NotFoundException($"Job with correlationId {correlationId} not found");

            job.Status = status;
            job.ErrorMessage = errorMessage;

            await jobRepository.UpdateAsync(job, ct);

            await auditService.LogAsync(
                correlationId,
                status == JobStatus.Failed ? AuditEventType.JobFailed : AuditEventType.JobCompleted,
                service: ServiceNames.Api,
                payload: new { status = status.ToString(), errorMessage },
                isSuccess: status != JobStatus.Failed,
                errorMessage: errorMessage,
                ct: ct);

            return MapToResponse(job);
        }

        private static JobStatusResponse MapToResponse(Job job) => new(
            job.Id,
            job.CorrelationId,
            job.Status,
            job.ErrorMessage,
            job.Receipt?.Id,
            job.CreatedAt,
            job.UpdatedAt);
    }
}
