using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/jobs")]
    public class JobsController(
    IJobService jobService,
    ICurrentUserService currentUser) : ControllerBase
    {
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(JobStatusResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        {
            var job = await jobService.GetByIdAsync(id, ct);
            return Ok(job);
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResponse<JobStatusResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] JobStatus? status = null,
            CancellationToken ct = default)
        {
            var jobs = await jobService.GetByUserIdAsync(
                currentUser.UserId, page, pageSize, status, ct);

            return Ok(jobs);
        }
    }
}
