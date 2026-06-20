using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ReceiptAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameReceiptJobIdToCorrelationId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Jobs_JobId",
                table: "Receipts");

            migrationBuilder.RenameColumn(
                name: "JobId",
                table: "Receipts",
                newName: "CorrelationId");

            migrationBuilder.RenameIndex(
                name: "IX_Receipts_JobId",
                table: "Receipts",
                newName: "IX_Receipts_CorrelationId");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Jobs_CorrelationId",
                table: "Jobs",
                column: "CorrelationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_Jobs_CorrelationId",
                table: "Receipts",
                column: "CorrelationId",
                principalTable: "Jobs",
                principalColumn: "CorrelationId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Jobs_CorrelationId",
                table: "Receipts");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Jobs_CorrelationId",
                table: "Jobs");

            migrationBuilder.RenameColumn(
                name: "CorrelationId",
                table: "Receipts",
                newName: "JobId");

            migrationBuilder.RenameIndex(
                name: "IX_Receipts_CorrelationId",
                table: "Receipts",
                newName: "IX_Receipts_JobId");

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_Jobs_JobId",
                table: "Receipts",
                column: "JobId",
                principalTable: "Jobs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
