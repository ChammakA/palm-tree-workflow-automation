
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PalmTree.Api.Data;
using PalmTree.Api.Models;

namespace PalmTree.Api.Services;

public class WorkflowExecutionService
{
    private readonly PalmTreeDbContext _context;

    public WorkflowExecutionService(PalmTreeDbContext context)
    {
        _context = context;
    }

    public async Task<WorkflowExecution?> RunAsync(string workflowId)
    {
        var workflow = await _context.Workflows.FindAsync(workflowId);
        if (workflow is null) return null;

        var execution = new WorkflowExecution
        {
            WorkflowId = workflowId
        };

        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync();

        try
        {
            using var doc = JsonDocument.Parse(workflow.NodesJson);
            var triggers = doc.RootElement.EnumerateArray().Where(n => n.GetProperty("type").GetString() == "trigger").ToList();

            if (triggers.Count != 1)
                throw new InvalidOperationException("Workflow must have exactly one trigger.");

            await ExecuteAsync(workflow, execution, triggers[0].GetProperty("id").GetString()!, new Dictionary<string, string>(), new List<ExecutionStep>());
        }
        catch (Exception ex)
        {
            await FailAsync(execution, ex.Message);
        }

        return execution;
    }

    public async Task<WorkflowExecution?> DecideAsync(string workflowId, string executionId, bool approved)
    {
        var execution = await _context.WorkflowExecutions.FirstOrDefaultAsync(e => e.Id == executionId && e.WorkflowId == workflowId);

        if (execution is null) return null;

        if (execution.Status != "WaitingForApproval" || execution.PendingApprovalNodeId is null)
            throw new InvalidOperationException("Execution is not waiting for approval.");

        var workflow = await _context.Workflows.FindAsync(workflowId) ?? throw new InvalidOperationException("Workflow not found.");

        using var edgesDoc = JsonDocument.Parse(workflow.EdgesJson);
        var edges = edgesDoc.RootElement.EnumerateArray().ToList();

        var approvalId = execution.PendingApprovalNodeId;
        var outgoing = edges.Where(e => e.GetProperty("source").GetString() == approvalId).ToList();

        ValidateBranches(outgoing, "Approval");

        var handle = approved ? "true" : "false";
        var selected = outgoing.Single(e => e.GetProperty("sourceHandle").GetString() == handle);

        var nextId = selected.GetProperty("target").GetString()!;

        var variables = JsonSerializer.Deserialize<Dictionary<string, string>>(execution.VariablesJson, JsonOptions) ?? new();

        var steps = JsonSerializer.Deserialize<List<ExecutionStep>>(execution.StepsJson, JsonOptions) ?? new();

        steps.Add(new ExecutionStep
        {
            NodeId = approvalId,
            NodeType = "approval",
            Status = approved ? "Approved" : "Rejected",
            Variables = new(variables),
            ExecutedAt = DateTime.UtcNow
        });

        execution.Status = "Running";
        execution.PendingApprovalNodeId = null;
        execution.ErrorMessage = null;
        execution.StepsJson = JsonSerializer.Serialize(steps, JsonOptions);

        await _context.SaveChangesAsync();

        try
        {
            await ExecuteAsync(workflow, execution, nextId, variables, steps);
        }
        catch (Exception ex)
        {
            await FailAsync(execution, ex.Message);
        }

        return execution;
    }

    private async Task ExecuteAsync(Workflow workflow, WorkflowExecution execution, string startNodeId, Dictionary<string, string> variables, List<ExecutionStep> steps)
    {
        using var nodesDoc = JsonDocument.Parse(workflow.NodesJson);
        using var edgesDoc = JsonDocument.Parse(workflow.EdgesJson);

        var nodes = nodesDoc.RootElement.EnumerateArray().ToList();
        var edges = edgesDoc.RootElement.EnumerateArray().ToList();

        var nodeById = nodes.ToDictionary(n => n.GetProperty("id").GetString()!);

        var outgoing = edges.GroupBy(e => e.GetProperty("source").GetString()!).ToDictionary(g => g.Key, g => g.ToList());

        var visited = new HashSet<string>();

        var currentId = startNodeId;

        while (true)
        {
            if (!visited.Add(currentId))
                throw new InvalidOperationException("Circular connection detected.");

            if (!nodeById.TryGetValue(currentId, out var node))
                throw new InvalidOperationException("Connection references a missing node.");

            var type = node.GetProperty("type").GetString()!;

            if (!node.TryGetProperty("data", out var data))
                throw new InvalidOperationException("Node is missing configuration.");

            string Setting(string key) =>
                data.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() ?? "" : "";

            var variableName = Setting("variableName").Trim();
            bool? conditionResult = null;

            switch (type)
            {
                case "trigger":
                case "action":
                    if (type == "action" && string.IsNullOrWhiteSpace(variableName))
                        throw new InvalidOperationException("Action requires a variable name.");

                    if (variableName.Length > 0)
                        variables[variableName] = Setting("variableValue");
                    break;

                case "condition":
                    if (!variables.TryGetValue(variableName, out var actual))
                        throw new InvalidOperationException($"Variable '{variableName}' is not defined.");

                    conditionResult = Setting("operator") switch
                    {
                        "" or "equals" =>
                            actual == Setting("expectedValue"),
                        "notEquals" =>
                            actual != Setting("expectedValue"),
                        _ => 
                            throw new InvalidOperationException("Unsupported condition operator.")
                    };
                    break;

                case "approval":
                    var approvalEdges = outgoing.GetValueOrDefault(currentId) ?? new List<JsonElement>();

                    ValidateBranches(approvalEdges, "Approval");

                    execution.Status = "WaitingForApproval";
                    execution.PendingApprovalNodeId = currentId;
                    execution.VariablesJson = JsonSerializer.Serialize(variables);

                    steps.Add(new ExecutionStep
                    {
                        NodeId = currentId,
                        NodeType = "approval",
                        Status = "WaitingForApproval",
                        Variables = new(variables),
                        ExecutedAt = DateTime.UtcNow
                    });

                    execution.StepsJson = JsonSerializer.Serialize(steps, JsonOptions);
                    execution.VariablesJson = JsonSerializer.Serialize(variables, JsonOptions);
                    await _context.SaveChangesAsync();
                    return;

                default:
                    throw new InvalidOperationException($"Node type '{type}' is not supported.");
            }

            steps.Add(new ExecutionStep
            {
                NodeId = currentId,
                NodeType = type,
                Status = "Completed",
                ConditionResult = conditionResult,
                Variables = new(variables),
                ExecutedAt = DateTime.UtcNow
            });

            execution.StepsJson = JsonSerializer.Serialize(steps, JsonOptions);
            execution.VariablesJson = JsonSerializer.Serialize(variables, JsonOptions);
            await _context.SaveChangesAsync();

            var nextEdges = outgoing.GetValueOrDefault(currentId) ?? new List<JsonElement>();

            if (type == "condition")
            {
                ValidateBranches(nextEdges, "Condition");

                var selectedHandle = conditionResult == true ? "true" : "false";

                nextEdges = nextEdges.Where(e => e.GetProperty("sourceHandle").GetString() == selectedHandle).ToList();
            }
            else if (nextEdges.Count > 1)
            {
                throw new InvalidOperationException("Only Condition and Approval nodes support branching.");
            }

            if (nextEdges.Count == 0) break;

            currentId = nextEdges[0].GetProperty("target").GetString()!;
        }

        execution.Status = "Completed";
        execution.CompletedAt = DateTime.UtcNow;
        execution.VariablesJson = JsonSerializer.Serialize(variables);
        execution.StepsJson = JsonSerializer.Serialize(steps, JsonOptions);

        await _context.SaveChangesAsync();
    }

    private static void ValidateBranches(List<JsonElement> edges, string nodeType)
    {
        var handles = edges.Select(e =>
        {
            if (!e.TryGetProperty("sourceHandle", out var h) || h.ValueKind != JsonValueKind.String)
                return null;
            return h.GetString();
        }).ToList();

        if (handles.Count != 2 || handles.Count(h => h == "true") != 1 || handles.Count(h => h == "false") != 1)
        {
            throw new InvalidOperationException($"{nodeType} requires exactly one True and one False connection.");
        }
    }

    private async Task FailAsync(WorkflowExecution execution, string message)
    {
        execution.Status = "Failed";
        execution.ErrorMessage = message;
        execution.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<List<WorkflowExecution>> GetHistoryAsync(string workflowId)
    {
        return await _context.WorkflowExecutions.Where(e => e.WorkflowId == workflowId).OrderByDescending(e => e.StartedAt).ToListAsync();
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}

public class ExecutionStep
{
    public string NodeId { get; set; } = "";
    public string NodeType { get; set; } = "";
    public string Status { get; set; } = "";
    public bool? ConditionResult { get; set; }
    public Dictionary<string, string> Variables { get; set; } = new();
    public DateTime ExecutedAt { get; set; }
}
