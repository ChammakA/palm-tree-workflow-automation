import type { Edge } from '@xyflow/react'
import type { PalmTreeNode } from './workflowStorage'

export function validateWorkflow(nodes: PalmTreeNode[], edges: Edge[]): string[] {
    const errors: string[] = []

    if (nodes.length === 0) {
        errors.push('Workflow must contain at least one node.')
        return errors
    }

    const triggers = nodes.filter((node) => node.type === 'trigger')

    if (triggers.length !== 1) {
        errors.push('Workflow must contain exactly one trigger.')
    }

    const nodeIds = new Set(nodes.map((node) => node.id))

    for (const edge of edges) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            errors.push(`Connection ${edge.id} references a missing node.`)
        }

        if (edge.source === edge.target) {
            errors.push('Nodes cannot connect to themselves.')
        }
    }

    const adjacency = new Map<string, string[]>()

    for (const node of nodes) {
        adjacency.set(node.id, [])
    }

    for (const edge of edges) {
        if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
            adjacency.get(edge.source)?.push(edge.target)
        }
    }

    if (triggers.length === 1) {
        const visited = new Set<string>()
        const stack = [triggers[0].id]

        while (stack.length > 0) {
            const id = stack.pop()!
            if (visited.has(id)) continue
            visited.add(id)

            for (const next of adjacency.get(id) ?? []) {
                stack.push(next)
            }
        }

        for (const node of nodes) {
            if (!visited.has(node.id)) {
                errors.push(`Node "${node.data.label}" is unreachable.`)
            }
        }
    }
    const visiting = new Set<string>()
    const visitedForCycles = new Set<string>()

    const hasCycle = (id: string): boolean => {
        if (visiting.has(id)) return true
        if (visitedForCycles.has(id)) return false

        visiting.add(id)

        for (const next of adjacency.get(id) ?? []) {
            if (hasCycle(next)) return true
        }

        visiting.delete(id)
        visitedForCycles.add(id)

        return false
    }
    if (nodes.some((node) => hasCycle(node.id))) {
        errors.push('Workflow contains a circular connection.')
    }
    return errors
}