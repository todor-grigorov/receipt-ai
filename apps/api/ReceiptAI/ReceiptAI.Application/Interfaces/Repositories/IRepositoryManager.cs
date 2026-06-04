namespace ReceiptAI.Application.Interfaces.Repositories
{
    public interface IRepositoryManager
    {
        IReceiptRepository Receipt { get; }
        IJobRepository Job { get; }
        IAuditLogRepository AuditLog { get; }
    }
}
