import type { Node, Edge } from '@xyflow/react'
import type { WorkflowNodeData, WorkflowNodeType } from '../types/workflowNode'

export type PalmTreeNode = Node<WorkflowNodeData, WorkflowNodeType> 
export interface SavedWorkflowGraph {
    nodes: PalmTreeNode[]
    edges: Edge[]
}

const getStorageKey = (workflowId: string) => `palmtree:workflow:${workflowId}`

export function saveWorkflowGraph(workflowId: string, graph: SavedWorkflowGraph) : void {
    localStorage.setItem(getStorageKey(workflowId), JSON.stringify(graph))
}

export function loadWorkflowGraph(workflowId: string): SavedWorkflowGraph | null {
    const saved = localStorage.getItem(getStorageKey(workflowId))
    if (!saved) return null

    try {
        const parsed: unknown = JSON.parse(saved)
        if (typeof parsed !== 'object' || parsed === null 
            || !('nodes' in parsed) || !Array.isArray(parsed.nodes)
            || !('edges' in parsed) || !Array.isArray(parsed.edges)) {
                return null
            }
        return parsed as SavedWorkflowGraph
    } catch {
        return null
    }
}