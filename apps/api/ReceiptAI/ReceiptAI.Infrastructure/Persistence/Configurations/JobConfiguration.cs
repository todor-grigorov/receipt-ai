using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReceiptAI.Domain.Entities;
using ReceiptAI.Domain.Enums;

namespace ReceiptAI.Infrastructure.Persistence.Configurations
{
    public class JobConfiguration : IEntityTypeConfiguration<Job>
    {
        public void Configure(EntityTypeBuilder<Job> builder)
        {
            builder.HasKey(j => j.Id);

            builder.Property(j => j.UserId)
                .IsRequired()
                .HasMaxLength(256);

            builder.Property(j => j.BlobUrl)
                .IsRequired()
                .HasMaxLength(2048);

            builder.Property(j => j.Status)
                .HasConversion<string>()
                .HasMaxLength(32)
                .HasDefaultValue(JobStatus.Pending);

            builder.Property(j => j.ErrorMessage)
                .HasMaxLength(2048);

            builder.HasIndex(j => j.CorrelationId)
                .IsUnique();

            builder.HasIndex(j => j.UserId);
            builder.HasIndex(j => j.Status);
            builder.HasIndex(j => j.CreatedAt);
        }
    }
}