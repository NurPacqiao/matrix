using System.Net;
using System.Net.Http.Json;
using OhtaniApi.Contracts;

namespace OhtaniApi.Tests;

public sealed class MatrixTests
{
    private const string Saved = """{"version":3,"cells":["a"]}""";

    [Fact]
    public async Task New_user_starts_empty_and_saves_round_trip()
    {
        using var api = new ApiFactory();
        var client = await api.SignedInClientAsync();
        Assert.Equal("[]", (await client.GetFromJsonAsync<MatrixResponse>("/api/matrix"))!.MatrixJson);

        (await client.PostAsJsonAsync("/api/matrix", new { matrixJson = Saved })).EnsureSuccessStatusCode();

        Assert.Equal(Saved, (await client.GetFromJsonAsync<MatrixResponse>("/api/matrix"))!.MatrixJson);
    }

    [Theory]
    [InlineData("")]
    [InlineData("[]")]
    [InlineData("null")]
    [InlineData("{ not json")]
    public async Task Anything_that_would_wipe_the_grid_is_rejected(string matrixJson)
    {
        using var api = new ApiFactory();
        var client = await api.SignedInClientAsync();
        await client.PostAsJsonAsync("/api/matrix", new { matrixJson = Saved });

        var response = await client.PostAsJsonAsync("/api/matrix", new { matrixJson });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(Saved, (await client.GetFromJsonAsync<MatrixResponse>("/api/matrix"))!.MatrixJson);
    }

    [Fact]
    public async Task Oversized_matrix_is_rejected()
    {
        using var api = new ApiFactory();
        var client = await api.SignedInClientAsync();

        var matrixJson = $$"""{"cells":["{{new string('x', 200_000)}}"]}""";

        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/matrix", new { matrixJson })).StatusCode);
    }
}
