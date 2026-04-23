using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KoperasiQu.API.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberPinHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Members_AdminUsers_AdminUserId",
                table: "Members");

            migrationBuilder.DropIndex(
                name: "IX_Members_AdminUserId",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "AdminUserId",
                table: "Members");

            migrationBuilder.AddColumn<string>(
                name: "PinHash",
                table: "Members",
                type: "longtext",
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PinHash",
                table: "Members");

            migrationBuilder.AddColumn<Guid>(
                name: "AdminUserId",
                table: "Members",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Members_AdminUserId",
                table: "Members",
                column: "AdminUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Members_AdminUsers_AdminUserId",
                table: "Members",
                column: "AdminUserId",
                principalTable: "AdminUsers",
                principalColumn: "Id");
        }
    }
}
