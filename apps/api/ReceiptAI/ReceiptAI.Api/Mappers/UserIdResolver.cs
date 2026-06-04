using AutoMapper;
using ReceiptAI.Application.DataTransferObjects.Requests;
using ReceiptAI.Application.Interfaces.Services;

namespace ReceiptAI.Api.Mappers
{
    public class UserIdResolver(ICurrentUserService currentUser)
    : IValueResolver<IFormFile, UploadReceiptRequest, string>
    {
        public string Resolve(
            IFormFile source,
            UploadReceiptRequest destination,
            string destMember,
            ResolutionContext context) => currentUser.UserId;
    }
}
