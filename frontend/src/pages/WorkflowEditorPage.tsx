import { Link, useParams } from 'react-router-dom'
import { mockWorkflows } from '../features/workflows/data/mockWorkflows'
import WorkflowCanvas from '../features/workflows/components/WorkflowCanvas'

function WorkflowEditorPage() {
    const { workflowId } = useParams()
    const workflow = mockWorkflows.find((w) => w.id === workflowId)

    if (!workflow) {
        return (
            <div className="page">
                <h2>Workflow not found.</h2>
                <Link to="/workflows">Back to Workflows</Link>
            </div>
        )
    }

    return (
        <div className="page">
            <Link to="/workflows" className="back-link">
                ← Workflows
            </Link>
            <div className="page-header">
                <h2>{workflow.name}</h2>
                <p>{workflow.description}</p>
            </div>
            <WorkflowCanvas />
        </div>
    )
}

export default WorkflowEditorPage