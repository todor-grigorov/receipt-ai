using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReceiptAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAuditLogJobForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Jobs_CorrelationId",
                table: "AuditLogs");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Jobs_CorrelationId",
                table: "Jobs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddUniqueConstraint(
                name: "AK_Jobs_CorrelationId",
                table: "Jobs",
                column: "CorrelationId");

            migrationBuilder.AddForeignKey(
                name: "FK_AuditLogs_Jobs_CorrelationId",
                table: "AuditLogs",
                column: "CorrelationId",
                principalTable: "Jobs",
                principalColumn: "CorrelationId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
