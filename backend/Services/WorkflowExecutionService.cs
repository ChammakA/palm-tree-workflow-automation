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
            var current = triggers[0];

            while (true)
            {
                var id = current.GetProperty("id").GetString()!;
                if (!visited.Add(id))
                    throw new InvalidOperationException("Circular connection detected.");

                var type = current.GetProperty("type").GetString()!;
                if (type != "trigger" && type != "action")
                    throw new InvalidOperationException($"Node type '{type}' is not executable yet.");

                steps.Add(new
                {
                    nodeId = id,
                    nodeType = type,
                    status = "Completed",
                    executedAt = DateTime.UtcNow
                });

                var nextEdges = outgoing.GetValueOrDefault(id) ?? new List<JsonElement>();
                if (nextEdges.Count == 0) break;
                if (nextEdges.Count > 1)
                    throw new InvalidOperationException("Branching is not supported yet.");
                
                var nextId = nextEdges[0].GetProperty("target").GetString()!;
                if (!nodeById.TryGetValue(nextId, out var next))
                    throw new InvalidOperationException("Connection references a missing node.");
                current = next;
            }

            if (visited.Count != nodes.Count)
                throw new InvalidOperationException("Workflow contains unreachable nodes.");
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