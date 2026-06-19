using AutoMapper;
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
     IRepositoryManager repository,
     IAuditService auditService,
     IMapper mapper) : IJobService
    {
        public async Task<JobStatusResponse> GetByIdAsync(
            Guid id,
            CancellationToken ct = default)
        {
            var job = await repository.Job.GetByIdAsync(id, ct)
                ?? throw new NotFoundException($"Job {id} not found");

            return mapper.Map<JobStatusResponse>(job);
        }

        public async Task<IEnumerable<JobStatusResponse>> GetByUserIdAsync(
            string userId,
            int page,
            int pageSize,
            JobStatus? statusFilter = null,
            CancellationToken ct = default)
        {
            var jobs = await repository.Job.GetByUserIdAsync(
                userId, page, pageSize, statusFilter, ct);

            return mapper.Map<IEnumerable<JobStatusResponse>>(jobs);
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

            await repository.Job.AddAsync(job, ct);

            await auditService.LogAsync(
                correlationId,
                AuditEventType.JobCreated,
                service: ServiceNames.Api,
                actor: $"user:{userId}",
                payload: new { blobUrl },
                ct: ct);

            return mapper.Map<JobStatusResponse>(job);
        }

        public async Task<JobStatusResponse> UpdateStatusAsync(
            Guid correlationId,
            JobStatus status,
            string? errorMessage = null,
            CancellationToken ct = default)
        {
            var job = await repository.Job.GetByCorrelationIdAsync(correlationId, ct)
                ?? throw new NotFoundException(
                    $"Job with correlationId {correlationId} not found");

            job.Status = status;
            job.ErrorMessage = errorMessage;

            await repository.Job.UpdateAsync(job, ct);

            var eventType = status switch
            {
                JobStatus.Failed => AuditEventType.JobFailed,
                JobStatus.Completed => AuditEventType.JobCompleted,
                JobStatus.Processing => AuditEventType.JobProcessingStarted,
                _ => AuditEventType.JobCreated
            };

            await auditService.LogAsync(
                correlationId,
                eventType,
                service: ServiceNames.Api,
                payload: new { status = status.ToString(), errorMessage },
                isSuccess: status != JobStatus.Failed,
                errorMessage: errorMessage,
                ct: ct);

            return mapper.Map<JobStatusResponse>(job);
        }

        public async Task<int> CountByUserIdAsync(
            string userId,
            JobStatus? statusFilter = null,
            CancellationToken ct = default) =>
            await repository.Job.CountByUserIdAsync(userId, statusFilter, ct);
    }
}
