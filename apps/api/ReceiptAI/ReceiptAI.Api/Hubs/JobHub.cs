using Microsoft.AspNetCore.SignalR;
using ReceiptAI.Application.Interfaces.Hubs;

namespace ReceiptAI.Api.Hubs
{
    public class JobHub : Hub<IJobHub>
    {
        public async Task SubscribeToJob(string jobId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"job:{jobId}");
        }

        public async Task UnsubscribeFromJob(string jobId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"job:{jobId}");
        }
    }
}
