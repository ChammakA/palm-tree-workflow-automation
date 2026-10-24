using PalmTree.Api.Models;
using PalmTree.Api.Services;
using Microsoft.EntityFrameworkCore;
using PalmTree.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<PalmTreeDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<WorkflowService>();

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

var workflows = app.MapGroup("/api/workflows");

workflows.MapGet("/", (WorkflowService service) =>
{
    return Results.Ok(service.GetAll());
});

workflows.MapGet("/{id}", (string id, WorkflowService service) =>
{
    var workflow = service.GetById(id);
    return workflow is null ? Results.NotFound() : Results.Ok(workflow);
});

workflows.MapPost("/", (Workflow workflow, WorkflowService service) =>
{
    if (string.IsNullOrWhiteSpace(workflow.Name))
    {
        return Results.BadRequest("Workflow name is required.");
    }

    var created = service.Create(workflow);
    return Results.Created($"/api/workflows/{created.Id}", created);
});

workflows.MapPut("/{id}", (string id, Workflow workflow, WorkflowService service) =>
{
    if (string.IsNullOrWhiteSpace(workflow.Name))
    {
        return Results.BadRequest("Workflow name is required.");
    }

    return service.Update(id, workflow) ? Results.NoContent() : Results.NotFound();
});

workflows.MapDelete("/{id}", (string id, WorkflowService service) =>
{
    return service.Delete(id) ? Results.NoContent() : Results.NotFound();
});

app.Run();