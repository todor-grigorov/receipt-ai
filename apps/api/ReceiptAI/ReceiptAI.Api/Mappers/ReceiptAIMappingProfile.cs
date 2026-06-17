using AutoMapper;
using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Application.DataTransferObjects.Responses;
using ReceiptAI.Domain.Entities;

namespace ReceiptAI.Api.Mappers
{
    public class ReceiptAIMappingProfile : Profile
    {
        public ReceiptAIMappingProfile()
        {
            // ── Entity → Response ────────────────────────────

            CreateMap<Job, JobStatusResponse>()
                .ConstructUsing(src => new JobStatusResponse(
                    src.Id,
                    src.CorrelationId,
                    src.Status,
                    src.ErrorMessage,
                    src.Receipt != null ? src.Receipt.Id : (Guid?)null,
                    src.CreatedAt,
                    src.UpdatedAt));

            CreateMap<Receipt, ReceiptResponse>()
                .ConstructUsing(src => new ReceiptResponse(
                    src.Id,
                    src.JobId,
                    src.MerchantName,
                    src.ReceiptDate,
                    src.Total,
                    src.Tax,
                    src.Currency,
                    null,              // BlobUrl set separately after mapping
                    src.LineItems.Select(li => new ReceiptLineItemResponse(
                        li.Id,
                        li.Description,
                        li.Quantity,
                        li.UnitPrice,
                        li.TotalPrice)),
                    src.CreatedAt));

            CreateMap<ReceiptLineItem, ReceiptLineItemResponse>();

            CreateMap<AuditLog, AuditLogResponse>();

            // ── IFormFile → UploadReceiptRequest ─────────────

            CreateMap<IFormFile, UploadReceiptRequest>()
                .ConstructUsing(src => new UploadReceiptRequest(
                    src.OpenReadStream(),
                    src.FileName,
                    src.ContentType,
                    src.Length,
                    string.Empty));
        }
    }
}
