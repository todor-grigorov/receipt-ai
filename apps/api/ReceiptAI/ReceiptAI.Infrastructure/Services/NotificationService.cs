using Microsoft.AspNetCore.SignalR;
using ReceiptAI.Application.Interfaces.Hubs;
using ReceiptAI.Application.Interfaces.Services;

namespace ReceiptAI.Infrastructure.Services
{
    public class NotificationService(IHubContext<Hub<IJobHub>, IJobHub> hubContext) : INotificationService
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
                    status = "completed",
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
                    status = "failed",
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
                    status = "processing"
                });
    }
}
