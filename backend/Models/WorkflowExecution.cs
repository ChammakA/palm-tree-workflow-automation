namespace PalmTree.Api.Models;

public class WorkflowExecution
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string WorkflowId { get; set; } = string.Empty;
    public string Status { get; set; } = "Running";
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string StepsJson { get; set; } = "[]";
}