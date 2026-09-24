export type WorkflowNodeType = 
    | 'trigger'
    | 'condition'
    | 'approval'
    | 'action'

export interface WorkflowNodeData extends Record<string, unknown> {
    label: string
    nodeType: WorkflowNodeType
    description?: string
}