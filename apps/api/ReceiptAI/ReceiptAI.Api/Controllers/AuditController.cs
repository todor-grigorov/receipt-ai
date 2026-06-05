using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Application.Interfaces.Services;

namespace ReceiptAI.Api.Controllers
{
    [ApiController]
    [Route("api/audit")]
    public class AuditController(
    IAuditService auditService,
    IMapper mapper) : ControllerBase
    {
        [HttpGet("{correlationId:guid}")]
        [ProducesResponseType(typeof(IEnumerable<AuditLogResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetAuditTrail(
            Guid correlationId,
            CancellationToken ct)
        {
            var trail = await auditService.GetTrailAsync(correlationId, ct);
            var response = mapper.Map<IEnumerable<AuditLogResponse>>(trail);
            return Ok(response);
        }
    }
}
