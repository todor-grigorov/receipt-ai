namespace ReceiptAI.Application.Interfaces.Services
{
    public interface INotificationService
    {
        Task NotifyJobCompletedAsync(Guid jobId, Guid resultId, CancellationToken ct = default);
        Task NotifyJobFailedAsync(Guid jobId, string errorMessage, CancellationToken ct = default);
        Task NotifyJobProcessingAsync(Guid jobId, CancellationToken ct = default);
    }
}
