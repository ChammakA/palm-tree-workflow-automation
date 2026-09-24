import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData, WorkflowNodeType } from '../../types/workflowNode';

type PalmTreeNode = Node<WorkflowNodeData, WorkflowNodeType>

function WorkflowNode({ data}: NodeProps<PalmTreeNode>) {
    return (
        <div className={`workflow-node workflow-node-${data.nodeType}`}>
            {data.nodeType !== 'trigger' && (
                <Handle type="target" position={Position.Left} />
            )}
            
            <div className="workflow-node-type">
                {data.nodeType}
            </div>

            <div className="workflow-node-label">
                {data.label}
            </div>

            {data.description && (
                <div className="workflow-node-description">
                    {data.description}
                </div>
            )}

            {data.nodeType !== 'action' && (
                <Handle type="source" position={Position.Right} />
            )}
        </div>
    )
}

export default WorkflowNode;