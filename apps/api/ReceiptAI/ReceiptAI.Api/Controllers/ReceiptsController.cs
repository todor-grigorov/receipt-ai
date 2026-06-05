using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Application.Interfaces.Services;

namespace ReceiptAI.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/receipts")]
    public class ReceiptsController(
    IReceiptService receiptService,
    ICurrentUserService currentUser,
    IMapper mapper) : ControllerBase
    {
        [HttpPost("upload")]
        [ProducesResponseType(typeof(ReceiptResponse), StatusCodes.Status202Accepted)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Upload(
            IFormFile file,
            CancellationToken ct)
        {
            if (file is null || file.Length == 0)
                return BadRequest("No file provided");

            var request = mapper.Map<UploadReceiptRequest>(file) with
            {
                UserId = currentUser.UserId
            };

            var response = await receiptService.UploadAsync(request, ct);

            return Accepted(response);
        }

        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ReceiptResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        {
            var receipt = await receiptService.GetByIdAsync(id, ct);
            return Ok(receipt);
        }

        [HttpGet("job/{jobId:guid}")]
        [ProducesResponseType(typeof(ReceiptResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetByJobId(Guid jobId, CancellationToken ct)
        {
            var receipt = await receiptService.GetByJobIdAsync(jobId, ct);
            return Ok(receipt);
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResponse<ReceiptResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            CancellationToken ct = default)
        {
            var receipts = await receiptService.GetByUserIdAsync(
                currentUser.UserId, page, pageSize, ct);

            var totalCount = await receiptService.CountByUserIdAsync(
                currentUser.UserId, ct);

            var response = new PagedResponse<ReceiptResponse>(
                receipts, page, pageSize, totalCount);

            Response.Headers.Append("X-Pagination",
                System.Text.Json.JsonSerializer.Serialize(new
                {
                    response.TotalCount,
                    response.TotalPages,
                    response.HasNextPage,
                    response.HasPreviousPage
                }));

            return Ok(response);
        }

        [HttpDelete("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            await receiptService.DeleteAsync(id, ct);
            return NoContent();
        }
    }
}
