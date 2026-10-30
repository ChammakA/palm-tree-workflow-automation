import type { SavedWorkflowGraph } from "../utils/workflowStorage"

const API_URL = 'http://localhost:5104/api/workflows'

export interface WorkflowDto {
    id: string
    name: string
    description: string
    createdAt: string
    updatedAt: string
}

export async function getWorkflows(): Promise<WorkflowDto[]> {
    const response = await fetch(API_URL)

    if (!response.ok) {
        throw new Error('Failed to fetch workflows')
    }

    return response.json()
}

export async function getWorkflowById(id: string): Promise<WorkflowDto> {
    const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`)
    
    if (!response.ok) {
        throw new Error(response.status === 404 ? 'Workflow not found' : 'Failed to fetch workflow')
    }

    return response.json()
}

export async function createWorkflow(name: string, description: string): Promise<WorkflowDto> {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
    })

    if (!response.ok) {
        throw new Error('Failed to create workflow')
    }
    return response.json()
}

export async function getWorkflowGraph(id: string): Promise<SavedWorkflowGraph> {
    const response = await fetch(`${API_URL}/${encodeURIComponent(id)}/graph`)

    if (!response.ok) {
        throw new Error('Failed to load workflow graph')
    }

    return response.json()
}

export async function updateWorkflowGraph(id: string, graph: SavedWorkflowGraph): Promise<void> {
    const response = await fetch (`${API_URL}/${encodeURIComponent(id)}/graph`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(graph)
    })

    if (!response.ok) {
        throw new Error('Failed to save workflow graph')
    }
}

export async function deleteWorkflow(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {method: 'DELETE'})

    if (!response.ok)
    {
        throw new Error('Failed to delete workflow')
    }
}