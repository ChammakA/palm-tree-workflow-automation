import type { WorkflowNodeType } from '../types/workflowNode';

interface NodePaletteProps {
    onAddNode: (nodeType: WorkflowNodeType) => void;
}

const nodeOptions: {
    type: WorkflowNodeType;
    label: string;
    description: string;
}[] = [
    {
        type: 'trigger',
        label: 'Trigger',
        description: 'Starts a workflow'
    },
    {
        type: 'condition',
        label: 'Condition',
        description: 'Evaluates a rule'
    },
    {
        type: 'approval',
        label: 'Approval',
        description: 'Requires a decision'
    },
    {
        type: 'action',
        label: 'Action',
        description: 'Performs an operation'
    }
]

function NodePalette({ onAddNode }: NodePaletteProps) {
    return (
        <aside className="node-palette">
            <div className="node-palette-header">
                <h3>Add Node</h3>
                <p>Choose a step to add to the workflow.</p>
            </div>

            <div className="node-palette-options">
                {nodeOptions.map((option) => (
                    <button key={option.type} type="button" className="node-palette-item" onClick={() => onAddNode(option.type)}>
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                    </button>
                ))}
            </div>
        </aside>
    )
}

export default NodePalette;