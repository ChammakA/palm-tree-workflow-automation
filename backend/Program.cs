var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "Healthy",
        Application = "Palm Tree API",
        Timestamp = DateTime.UtcNow
    });
});

app.Run();