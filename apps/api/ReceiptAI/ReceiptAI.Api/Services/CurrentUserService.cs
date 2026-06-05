using ReceiptAI.Application.Interfaces.Services;
using System.Security.Claims;

namespace ReceiptAI.Api.Services
{
    public class CurrentUserService(IHttpContextAccessor httpContextAccessor)
    : ICurrentUserService
    {
        public string UserId => httpContextAccessor.HttpContext?.User
            .FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;

        public string Email => httpContextAccessor.HttpContext?.User
            .FindFirstValue(ClaimTypes.Email) ?? string.Empty;

        public bool IsAuthenticated => httpContextAccessor.HttpContext?.User
            .Identity?.IsAuthenticated ?? false;
    }
}
