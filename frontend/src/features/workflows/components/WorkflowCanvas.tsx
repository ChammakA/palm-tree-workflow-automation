import { addEdge, Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, type Connection, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import WorkflowNode from './nodes/WorkflowNode';
import NodePalette from './NodePalette';
import type { WorkflowNodeData, WorkflowNodeType } from '../types/workflowNode';
import type { PalmTreeNode } from '../utils/workflowStorage';
import { getWorkflowGraph, updateWorkflowGraph } from '../api/workflowApi';

import { useState, useEffect } from 'react';
import NodeConfigPanel from './NodeConfigPanel';

const nodeTypes = {
    trigger: WorkflowNode,
    condition: WorkflowNode,
    approval: WorkflowNode,
    action: WorkflowNode,
}

const nodeDefaults: Record<WorkflowNodeType, { label: string, description: string}> = {
    trigger: {
        label: 'New Trigger',
        description: 'Starts the workflow.'
    },
    condition: {
        label: 'New Condition',
        description: 'Evaluates a workflow rule.'
    },
    approval: {
        label: 'New Approval',
        description: 'Requires an approval decision.'
    },
    action: {
        label: 'New Action',
        description: 'Performs a workflow operation.'
    }
}

interface WorkflowCanvasProps {
    workflowId: string
}

const getGraphSnapshot = (nodes: PalmTreeNode[], edges: Edge[]) => 
    JSON.stringify({
        nodes: nodes.map((node) => ({
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data,
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
        }))
    })

function WorkflowCanvas({ workflowId }: WorkflowCanvasProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<PalmTreeNode>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;

    const updateNode = (id: string, updates: Partial<WorkflowNodeData>) => {
        setNodes((currentNodes) => currentNodes.map((node) => node.id === id ? {
            ...node,
            data: {
                ...node.data,
                ...updates,
            }
        } : node))
    }

    const deleteNode = (id: string) => {
        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== id))
        setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== id && edge.target !== id))
        setSelectedNodeId(null)
    }

    const onConnect = (connection: Connection) => {
        setEdges((currentEdges) => addEdge(connection, currentEdges));
    }

    const addNode = (nodeType: WorkflowNodeType) => {
        const defaults = nodeDefaults[nodeType];

        const newNode: PalmTreeNode = {
            id: crypto.randomUUID(),
            type: nodeType,
            position: { x: 250 + Math.random() * 200, y: 150 + Math.random() * 200 },
            data: {
                label: defaults.label,
                nodeType: nodeType,
                description: defaults.description
            }
        }

        setNodes((currentNodes) => [...currentNodes, newNode])
    }

    const [saveStatus, setSaveStatus] = useState('')
    const [savedSnapshot, setSavedSnapshot] = useState(() => getGraphSnapshot([], []))
    const currentSnapshot = getGraphSnapshot(nodes, edges)

    useEffect(() => {
        let active = true

        async function loadGraph() {
            setLoading(true)
            setLoadError(null)

            try {
                const graph = await getWorkflowGraph(workflowId)

                if (!active) return

                setNodes(graph.nodes)
                setEdges(graph.edges)
                setSavedSnapshot(getGraphSnapshot(graph.nodes, graph.edges))
            } catch {
                if (active) {
                    setLoadError('Failed to load workflow graph.')
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        loadGraph()
        return () => {
            active = false
        }
    }, [workflowId, setNodes, setEdges])

    const hasUnsavedChanges = currentSnapshot !== savedSnapshot

    useEffect(() => {
        document.title = hasUnsavedChanges ? '* Unsaved Change - Palm Tree' : 'Palm Tree'
    }, [hasUnsavedChanges])

    const handleSave = async () => {
        if (saving || loading || loadError) return

        setSaving(true)
        setSaveStatus('')

        try {
            const graph = { nodes, edges }
            await updateWorkflowGraph(workflowId, graph)

            setSavedSnapshot(getGraphSnapshot(graph.nodes, graph.edges))
            setSaveStatus('Saved successfully!')
        } catch {
            setSaveStatus('Failed to save a workflow.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className='workflow-editor-container'>Loading workflow graph...</div>
    }

    if (loadError) {
        return (
            <div className='workflow-editor-container' role='alert'>
                {loadError}
            </div>
        )
    }

    return (
        <div className="workflow-editor-container">
            <div className="workflow-toolbar">
                <span role="status">
                    {saveStatus.startsWith('Failed') ? saveStatus : hasUnsavedChanges ? 'Unsaved changes' : saveStatus || 'All changes saved'}
                </span>

                <button type="button" className="primary-button" onClick={handleSave} disabled={!hasUnsavedChanges || saving || loading || !!loadError}>
                    {saving ? 'Saving...' : 'Save Workflow'}
                </button>
            </div>
            <div className="workflow-editor">
                <NodePalette onAddNode={addNode} />
                <div className="workflow-canvas">
                    <ReactFlow<PalmTreeNode, Edge>
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodesDraggable={!saving}
                        nodesConnectable={!saving}
                        elementsSelectable={!saving}
                        deleteKeyCode={saving ? null : 'Backspace'}
                        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                        onPaneClick={() => setSelectedNodeId(null)}
                        onNodesDelete={(deletedNodes) => {
                            if (deletedNodes.some((node) => node.id === selectedNodeId)) {
                                setSelectedNodeId(null)
                            }
                        }}
                        fitView
                    >
                        <Background />
                        <Controls />
                        <MiniMap />
                    </ReactFlow>
                </div>
                <NodeConfigPanel node={selectedNode} onUpdateNode={updateNode} onDeleteNode={deleteNode} />
            </div>
        </div>
    )
}

export default WorkflowCanvas;