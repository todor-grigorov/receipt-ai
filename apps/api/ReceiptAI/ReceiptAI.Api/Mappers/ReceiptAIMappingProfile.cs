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
                .ForCtorParam(nameof(JobStatusResponse.ResultId),
                    opt => opt.MapFrom(src => src.Receipt != null
                        ? src.Receipt.Id
                        : (Guid?)null));

            CreateMap<Receipt, ReceiptResponse>();

            CreateMap<ReceiptLineItem, ReceiptLineItemResponse>();

            CreateMap<AuditLog, AuditLogResponse>();

            // ── IFormFile → UploadReceiptRequest ─────────────

            CreateMap<IFormFile, UploadReceiptRequest>()
                .ForCtorParam(nameof(UploadReceiptRequest.FileStream),
                    opt => opt.MapFrom(src => src.OpenReadStream()))
                .ForCtorParam(nameof(UploadReceiptRequest.FileName),
                    opt => opt.MapFrom(src => src.FileName))
                .ForCtorParam(nameof(UploadReceiptRequest.ContentType),
                    opt => opt.MapFrom(src => src.ContentType))
                .ForCtorParam(nameof(UploadReceiptRequest.FileSizeBytes),
                    opt => opt.MapFrom(src => src.Length));
        }
    }
}
