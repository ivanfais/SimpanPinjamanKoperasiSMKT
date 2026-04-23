using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KoperasiQu.API.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCreditScore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreditScore",
                table: "Members",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreditScore",
                table: "Members");
        }
    }
}
