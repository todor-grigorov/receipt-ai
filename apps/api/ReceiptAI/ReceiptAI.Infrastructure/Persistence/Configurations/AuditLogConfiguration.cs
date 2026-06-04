using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReceiptAI.Domain.Entities;

namespace ReceiptAI.Infrastructure.Persistence.Configurations
{
    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.HasKey(a => a.Id);

            builder.Property(a => a.EventType)
                .HasConversion<string>()
                .HasMaxLength(64)
                .IsRequired();

            builder.Property(a => a.Service)
                .IsRequired()
                .HasMaxLength(64);

            builder.Property(a => a.Actor)
                .HasMaxLength(256);

            builder.Property(a => a.ErrorMessage)
                .HasMaxLength(2048);

            builder.Property(a => a.Payload)
                .HasColumnType("jsonb");

            builder.HasIndex(a => a.CorrelationId);
            builder.HasIndex(a => a.EventType);
            builder.HasIndex(a => a.CreatedAt);
            builder.HasIndex(a => a.Service);

            // Audit logs are append-only — no cascade deletes
            builder.HasOne(a => a.Job)
                .WithMany(j => j.AuditLogs)
                .HasForeignKey(a => a.CorrelationId)
                .HasPrincipalKey(j => j.CorrelationId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
