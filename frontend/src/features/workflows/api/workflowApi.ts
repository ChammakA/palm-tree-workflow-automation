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