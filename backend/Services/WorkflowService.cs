using PalmTree.Api.Data;
using PalmTree.Api.Models;
using System.Text.Json;

namespace PalmTree.Api.Services;

public class WorkflowService
{
    private readonly PalmTreeDbContext _context;
    public WorkflowService(PalmTreeDbContext context)
    {
        _context = context;
    }
    public IEnumerable<Workflow> GetAll()
    {
        return _context.Workflows.ToList();
    }

    public Workflow? GetById(string id)
    {
        return _context.Workflows.Find(id);
    }

    public Workflow Create(Workflow workflow)
    {
        workflow.Id = Guid.NewGuid().ToString();
        workflow.CreatedAt = DateTime.UtcNow;
        workflow.UpdatedAt = DateTime.UtcNow;

        _context.Workflows.Add(workflow);
        _context.SaveChanges();

        return workflow;
    }

    public bool Update(string id, Workflow updated)
    {
        var existing = _context.Workflows.Find(id);
        if (existing is null)
        {
            return false;
        }

        existing.Name = updated.Name;
        existing.Description = updated.Description;
        existing.UpdatedAt = DateTime.UtcNow;

        _context.SaveChanges();
        return true;
    }

    public bool Delete(string id)
    {
        var workflow = _context.Workflows.Find(id);

        if (workflow is null)
        {
            return false;
        }

        _context.Workflows.Remove(workflow);
        _context.SaveChanges();
        return true;
    }

    public WorkflowGraphDto? GetGraph(string id)
    {
        var workflow = _context.Workflows.Find(id);

        if (workflow is null)
        {
            return null;
        }

        return new WorkflowGraphDto
        {
            Nodes = JsonSerializer.Deserialize<JsonElement>(workflow.NodesJson),
            Edges = JsonSerializer.Deserialize<JsonElement>(workflow.EdgesJson)
        };
    }

    public bool SaveGraph(string id, WorkflowGraphDto graph)
    {
        var workflow = _context.Workflows.Find(id);

        if (workflow is null)
        {
            return false;
        }

        workflow.NodesJson = graph.Nodes.GetRawText();
        workflow.EdgesJson = graph.Edges.GetRawText();
        workflow.UpdatedAt = DateTime.UtcNow;

        _context.SaveChanges();

        return true;
    }
}