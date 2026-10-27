using System.Text.Json;

namespace PalmTree.Api.Models;

public class WorkflowGraphDto
{
    public JsonElement Nodes { get; set; }
    public JsonElement Edges { get; set; }
}