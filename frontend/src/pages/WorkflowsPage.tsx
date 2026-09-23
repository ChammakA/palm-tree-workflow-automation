import { Link } from 'react-router-dom'
import { mockWorkflows } from '../features/workflows/data/mockWorkflows'

function WorkflowsPage() {
    return (
        <div className="page">
            <div className="page-header page-header-row">
                <div>
                    <h2>Workflows</h2>
                    <p>Create and manage your automated workflows.</p>
                </div>
                <button type="button" className="primary-button">
                    New Workflow
                </button>
            </div>

            <div className="workflow-list">
                {mockWorkflows.map((workflow) => (
                    <Link key={workflow.id} to={`/workflows/${workflow.id}`} className="workflow-card">
                        <div>
                            <h3>{workflow.name}</h3>
                            <p>{workflow.description}</p>
                        </div>
                        <span>Open</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}

export default WorkflowsPage