using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OhtaniApi.Migrations
{
    /// <inheritdoc />
    public partial class AddMatrixJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MatrixJson",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MatrixJson",
                table: "Users");
        }
    }
}
