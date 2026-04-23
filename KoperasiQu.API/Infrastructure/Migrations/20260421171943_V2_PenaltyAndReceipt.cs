using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KoperasiQu.API.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class V2_PenaltyAndReceipt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVerified",
                table: "Installments",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PenaltyAmount",
                table: "Installments",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptUrl",
                table: "Installments",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVerified",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "PenaltyAmount",
                table: "Installments");

            migrationBuilder.DropColumn(
                name: "ReceiptUrl",
                table: "Installments");
        }
    }
}
