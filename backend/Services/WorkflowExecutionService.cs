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

        using var nodesDoc = JsonDocument.Parse(workflow.NodesJson);
        using var edgesDoc = JsonDocument.Parse(workflow.EdgesJson);
        var nodes = nodesDoc.RootElement.EnumerateArray().ToList();
        var edges = edgesDoc.RootElement.EnumerateArray().ToList();

        var execution = new WorkflowExecution
        {
            WorkflowId = workflowId
        };

        _context.WorkflowExecutions.Add(execution);
        await _context.SaveChangesAsync();
        var steps = new List<object>();

        try
        {
            var triggers = nodes.Where(n => n.GetProperty("type").GetString() == "trigger").ToList();
            if (triggers.Count != 1)
                throw new InvalidOperationException("Workflow must have exactly one trigger.");
            
            var nodeById = nodes.ToDictionary(n => n.GetProperty("id").GetString())!;
            var outgoing = edges.GroupBy(e => e.GetProperty("source").GetString()!).ToDictionary(g => g.Key, g => g.ToList());
            var visited = new HashSet<string>();
            var variables = new Dictionary<string, string>();
            var current = triggers[0];

            while (true)
            {
                var id = current.GetProperty("id").GetString()!;
                if (!visited.Add(id))
                    throw new InvalidOperationException("Circular connection detected.");

                var type = current.GetProperty("type").GetString()!;
                if (!current.TryGetProperty("data", out var data))
                    throw new InvalidOperationException($"Node '{id}' is missing configuration.");

                string ReadSetting(string name)
                {
                    return data.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() ?? "" : "";
                }

                var variableName = ReadSetting("variableName").Trim();
                var variableValue = ReadSetting("variableValue");

                bool? conditionResult = null;

                switch (type)
                {
                    case "trigger":
                    case "action":
                        if (!string.IsNullOrWhiteSpace(variableName))
                        {
                            variables[variableName] = variableValue;
                        }
                        else if (type == "action")
                        {
                            throw new InvalidOperationException("Action requires a variable name.");
                        }
                        break;
                    case "condition":
                        if (string.IsNullOrWhiteSpace(variableName))
                            throw new InvalidOperationException("Condition requires a variable name.");
                        if (!variables.TryGetValue(variableName, out var actual))
                            throw new InvalidOperationException($"Variable '{variableName}' is not defined.");

                        var expected = ReadSetting("expectedValue");
                        var op = ReadSetting("operator");

                        conditionResult = op switch
                        {
                            "" or "equals" => actual == expected,
                            "notEquals" => actual != expected,
                            _ => throw new InvalidOperationException($"Unsupported operator '{op}'.")
                        };
                        break;
                    default:
                        throw new InvalidOperationException($"Node type '{type}' is not executable yet.");
                }

                steps.Add(new
                {
                    nodeId = id,
                    nodeType = type,
                    status = "Completed",
                    conditionResult,
                    variables = new Dictionary<string, string>(variables),
                    executedAt = DateTime.UtcNow
                });

                var nextEdges = outgoing.GetValueOrDefault(id) ?? new List<JsonElement>();
                
                if (type == "condition")
                {
                    if (nextEdges.Count != 2 || nextEdges.Any(e => !e.TryGetProperty("sourceHandle", out var h) || h.ValueKind != JsonValueKind.String ||
                                                                (h.GetString() != "true" && h.GetString() != "false")) || 
                                                                nextEdges.Select(e => e.GetProperty("sourceHandle").GetString()).Distinct().Count() != 2)
                    {
                        throw new InvalidOperationException("Condition requires exactly one True and one False connection.");
                    }

                    var selectedHandle = conditionResult == true ? "true" : "false";

                    nextEdges = nextEdges.Where(e => e.GetProperty("sourceHandle").GetString() == selectedHandle).ToList();
                }
                else if (nextEdges.Count > 1)
                {
                    throw new InvalidOperationException("Only Condition node can have multiple outpupts.");
                }

                if (nextEdges.Count == 0) break;

                var nextId = nextEdges[0].GetProperty("target").GetString()!;

                if (!nodeById.TryGetValue(nextId, out var next))
                    throw new InvalidOperationException("Connection references a missing node.");
                current = next;
            }

            execution.Status = "Completed";
        }
        catch (Exception ex)
        {
            execution.Status = "Failed";
            execution.ErrorMessage = ex.Message;
        }
        finally
        {
            execution.StepsJson = JsonSerializer.Serialize(steps);
            execution.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return execution;
    }

    public async Task<List<WorkflowExecution>> GetHistoryAsync(string workflowId)
    {
        return await _context.WorkflowExecutions.Where(e => e.WorkflowId == workflowId)
            .OrderByDescending(e => e.StartedAt).ToListAsync();
    }
}