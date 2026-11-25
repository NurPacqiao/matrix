using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OhtaniApi.Migrations
{
    /// <inheritdoc />
    public partial class UniqueLogsAndUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Logs used to carry the time of the first save; keep just the UTC day so the index
            // below means "one log per day". Nothing is deleted: if duplicates already exist the
            // index fails and the whole migration rolls back.
            migrationBuilder.Sql(
                """
                UPDATE "DailyLogs"
                SET "Date" = date_trunc('day', "Date" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Users_GoogleId",
                table: "Users",
                column: "GoogleId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DailyLogs_UserId_Date",
                table: "DailyLogs",
                columns: new[] { "UserId", "Date" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_DailyLogs_Users_UserId",
                table: "DailyLogs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DailyLogs_Users_UserId",
                table: "DailyLogs");

            migrationBuilder.DropIndex(
                name: "IX_Users_GoogleId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_DailyLogs_UserId_Date",
                table: "DailyLogs");
        }
    }
}
