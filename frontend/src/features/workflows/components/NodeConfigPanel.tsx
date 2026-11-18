import type { Node } from '@xyflow/react'
import type { WorkflowNodeType, WorkflowNodeData } from '../types/workflowNode'

type PalmTreeNode = Node<WorkflowNodeData, WorkflowNodeType>

interface NodeConfigPanelProps {
    node: PalmTreeNode | null
    onUpdateNode: (
        id: string,
        updates: Partial<WorkflowNodeData>
    ) => void
    onDeleteNode: (id: string) => void
}

function NodeConfigPanel({ node, onUpdateNode, onDeleteNode }: NodeConfigPanelProps) {
    if (!node) {
        return (
            <aside className="node-config-panel">
                <h3>Node Settings</h3>
                <p>Select a node to configure it.</p>
            </aside>
        )
    }

    return (
        <aside className="node-config-panel">
            <h3>Node Settings</h3>
            <p className="node-config-type">
                {node.data.nodeType.toUpperCase()}
            </p>

            <div className="form-group">
                <label htmlFor="node-name">Name</label>
               <input id="node-name" type="text" value={node.data.label} onChange={(e) => onUpdateNode(node.id, { label: e.target.value})} />  
            </div>

            <div className="form-group">
                <label htmlFor="node-description">Description</label>
                <textarea id="node-description" rows={4} value={node.data.description ?? ''} onChange={(e) => onUpdateNode(node.id, { description: e.target.value})} />
            </div>

            {(node.type === 'trigger' || node.type === 'action') && (
                <>
                    <div className="form-group">
                        <label>Variable Name</label>
                        <input value={node.data.variableName ?? ''} onChange={(e) => onUpdateNode(node.id, { variableName: e.target.value})} placeholder="e.g. amount" />
                    </div>

                    <div className="form-group">
                        <label>Variable Value</label>
                        <input value={node.data.variableValue ?? ''} onChange={(e) => onUpdateNode(node.id, { variableValue: e.target.value})} placeholder="e.g. 100" />
                    </div>
                </>
            )}

            {node.type === 'condition' && (
                <>
                    <div className="form-group">
                        <label>Variable to Check</label>
                        <input value={node.data.variableName ?? ''} onChange={(e) => onUpdateNode(node.id, { variableName: e.target.value})} placeholder="e.g. amount" />
                    </div>

                    <div className="form-group">
                        <label>Operator</label>
                        <select value={node.data.operator ?? 'equals'} onChange={(e) => onUpdateNode(node.id, { operator: e.target.value as 'equals' | 'notEquals'})}>
                            <option value="equals">Equals</option>
                            <option value="notEquals">Does Not Equal</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Expected Value</label>
                        <input value={node.data.expectedValue ?? ''} onChange={(e) => onUpdateNode(node.id, { expectedValue: e.target.value})} placeholder="e.g. 100" />
                    </div>
                </>
            )}

            <button className="delete-node-button" type="button" onClick={() => onDeleteNode(node.id)}>Delete Node</button>
        </aside>
    )
}

export default NodeConfigPanel