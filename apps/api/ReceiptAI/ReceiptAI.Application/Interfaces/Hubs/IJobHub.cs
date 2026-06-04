namespace ReceiptAI.Application.Interfaces.Hubs
{
    public interface IJobHub
    {
        Task JobStatusChanged(object payload);
    }
}
