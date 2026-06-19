using Microsoft.AspNetCore.SignalR;
using ReceiptAI.Api.Hubs;
using ReceiptAI.Application.Interfaces.Hubs;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Api.Services
{
    public class NotificationService(IHubContext<JobHub, IJobHub> hubContext) : INotificationService
    {
        public async Task NotifyJobCompletedAsync(
            Guid jobId,
            Guid resultId,
            CancellationToken ct = default) =>
            await hubContext.Clients
                .Group($"job:{jobId}")
                .JobStatusChanged(new
                {
                    jobId,
                    status = JobStatus.Completed.ToString(),   // ← "Completed"
                    resultId
                });

        public async Task NotifyJobFailedAsync(
            Guid jobId,
            string errorMessage,
            CancellationToken ct = default) =>
            await hubContext.Clients
                .Group($"job:{jobId}")
                .JobStatusChanged(new
                {
                    jobId,
                    status = JobStatus.Failed.ToString(),       // ← "Failed"
                    errorMessage
                });

        public async Task NotifyJobProcessingAsync(
            Guid jobId,
            CancellationToken ct = default) =>
            await hubContext.Clients
                .Group($"job:{jobId}")
                .JobStatusChanged(new
                {
                    jobId,
                    status = JobStatus.Processing.ToString()    // ← "Processing"
                });
    }
}
