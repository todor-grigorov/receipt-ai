using ReceiptAI.Application.Interfaces.Repositories;

namespace ReceiptAI.Infrastructure.Persistence.Repositories
{
    public sealed class RepositoryManager : IRepositoryManager
    {
        private readonly AppDbContext _appDbContext;
        private readonly Lazy<IJobRepository> _jobRepository;
        private readonly Lazy<IReceiptRepository> _receiptRepository;
        private readonly Lazy<IAuditLogRepository> _auditLogRepository;

        public RepositoryManager(AppDbContext appDbContext)
        {
            _appDbContext = appDbContext;
            _jobRepository = new Lazy<IJobRepository>(() => new JobRepository(appDbContext));
            _receiptRepository = new Lazy<IReceiptRepository>(() => new ReceiptRepository(appDbContext));
            _auditLogRepository = new Lazy<IAuditLogRepository>(() => new AuditLogRepository(appDbContext));
        }

        public IJobRepository Job => _jobRepository.Value;

        public IReceiptRepository Receipt => _receiptRepository.Value;

        public IAuditLogRepository AuditLog => _auditLogRepository.Value;
    }
}
