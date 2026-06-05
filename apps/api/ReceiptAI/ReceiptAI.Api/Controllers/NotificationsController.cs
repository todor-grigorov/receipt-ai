using Microsoft.AspNetCore.Mvc;
using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Api.Controllers
{
    [ApiController]
    [Route("api/internal/notifications")]
    public class NotificationsController(
    IJobService jobService,
    INotificationService notificationService) : ControllerBase
    {
        [HttpPost("jobs/{correlationId:guid}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> NotifyJobStatus(
            Guid correlationId,
            [FromBody] NotifyJobRequest request,
            CancellationToken ct)
        {
            await jobService.UpdateStatusAsync(
                correlationId,
                request.Status,
                request.ErrorMessage,
                ct);

            switch (request.Status)
            {
                case JobStatus.Completed when request.ResultId.HasValue:
                    await notificationService.NotifyJobCompletedAsync(
                        correlationId,
                        request.ResultId.Value,
                        ct);
                    break;

                case JobStatus.Failed:
                    await notificationService.NotifyJobFailedAsync(
                        correlationId,
                        request.ErrorMessage ?? "Unknown error",
                        ct);
                    break;

                case JobStatus.Processing:
                    await notificationService.NotifyJobProcessingAsync(
                        correlationId,
                        ct);
                    break;
            }

            return Ok();
        }
    }
}
