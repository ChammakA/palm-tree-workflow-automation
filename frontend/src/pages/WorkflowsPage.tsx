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

            <div className="empty-state">
                <h3>No workflows yet</h3>
                <p>Create your first workflow to get started.</p>
            </div>

            
        </div>
    )
}

export default WorkflowsPage