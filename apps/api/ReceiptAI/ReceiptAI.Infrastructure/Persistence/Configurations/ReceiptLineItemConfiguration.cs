using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReceiptAI.Domain.Entities;

namespace ReceiptAI.Infrastructure.Persistence.Configurations
{
    public class ReceiptLineItemConfiguration : IEntityTypeConfiguration<ReceiptLineItem>
    {
        public void Configure(EntityTypeBuilder<ReceiptLineItem> builder)
        {
            builder.HasKey(li => li.Id);

            builder.Property(li => li.Description)
                .IsRequired()
                .HasMaxLength(512);

            builder.Property(li => li.Quantity)
                .HasDefaultValue(1);

            builder.Property(li => li.UnitPrice)
                .HasPrecision(18, 2);

            builder.Property(li => li.TotalPrice)
                .HasPrecision(18, 2);

            builder.HasIndex(li => li.ReceiptId);
        }
    }
}
