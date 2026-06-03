using ReceiptAI.Application.Interfaces.Repositories;
using ReceiptAI.Application.Interfaces.Services;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;
using System.Text.Json;

namespace ReceiptAI.Application.Services
{
    public class AuditService(IAuditLogRepository auditLogRepository) : IAuditService
    {
        public async Task LogAsync(
            Guid correlationId,
            AuditEventType eventType,
            string service,
            string? actor = null,
            object? payload = null,
            bool isSuccess = true,
            string? errorMessage = null,
            CancellationToken ct = default)
        {
            var auditLog = new AuditLog
            {
                CorrelationId = correlationId,
                EventType = eventType,
                Service = service,
                Actor = actor,
                Payload = payload is not null
                    ? JsonSerializer.Serialize(payload)
                    : null,
                IsSuccess = isSuccess,
                ErrorMessage = errorMessage
            };

            await auditLogRepository.AddAsync(auditLog, ct);
        }

        public async Task<IEnumerable<AuditLog>> GetTrailAsync(
            Guid correlationId,
            CancellationToken ct = default)
        {
            return await auditLogRepository.GetByCorrelationIdAsync(correlationId, ct);
        }
    }
}
