import { addEdge, Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import WorkflowNode from './nodes/WorkflowNode';
import NodePalette from './NodePalette';
import type { WorkflowNodeData, WorkflowNodeType } from '../types/workflowNode';

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'trigger',
        position: { x: 50, y: 200 },
        data: {
        label: 'Request Submitted',
        nodeType: 'trigger',
        description: 'Starts when a new request is submitted.',
        },
    },
    {
        id: '2',
        type: 'condition',
        position: { x: 350, y: 200 },
        data: {
        label: 'Amount > $5,000',
        nodeType: 'condition',
        description: 'Checks the value of the request.',
        },
    },
    {
        id: '3',
        type: 'approval',
        position: { x: 650, y: 100 },
        data: {
        label: 'Manager Approval',
        nodeType: 'approval',
        description: 'Requires approval from a manager.',
        },
    },
    {
        id: '4',
        type: 'action',
        position: { x: 950, y: 100 },
        data: {
        label: 'Mark Approved',
        nodeType: 'action',
        description: 'Completes the approval process.',
        },
    },
]

const initialEdges: Edge[] = []

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

function WorkflowCanvas() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

    return (
        <div className="workflow-editor">
            <NodePalette onAddNode={addNode} />
            <div className="workflow-canvas">
                <ReactFlow 
                    nodes={nodes} 
                    edges={edges} 
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange} 
                    onEdgesChange={onEdgesChange} 
                    onConnect={onConnect} 
                    fitView
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>
            
        </div>
    )
}

export default WorkflowCanvas;