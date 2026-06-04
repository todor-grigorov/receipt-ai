using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReceiptAI.Domain.Entities;

namespace ReceiptAI.Infrastructure.Persistence.Configurations
{
    public class ReceiptConfiguration : IEntityTypeConfiguration<Receipt>
    {
        public void Configure(EntityTypeBuilder<Receipt> builder)
        {
            builder.HasKey(r => r.Id);

            builder.Property(r => r.UserId)
                .IsRequired()
                .HasMaxLength(256);

            builder.Property(r => r.MerchantName)
                .IsRequired()
                .HasMaxLength(512);

            builder.Property(r => r.OriginalFileName)
                .IsRequired()
                .HasMaxLength(512);

            builder.Property(r => r.Total)
                .HasPrecision(18, 2);

            builder.Property(r => r.Tax)
                .HasPrecision(18, 2);

            builder.Property(r => r.Currency)
                .HasMaxLength(8);

            builder.Property(r => r.RawLlmResponse)
                .IsRequired(false);

            builder.HasIndex(r => r.UserId);
            builder.HasIndex(r => r.JobId).IsUnique();
            builder.HasIndex(r => r.CreatedAt);

            builder.HasMany(r => r.LineItems)
                .WithOne(li => li.Receipt)
                .HasForeignKey(li => li.ReceiptId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
