import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWorkflows, type WorkflowDto } from '../features/workflows/api/workflowApi';

function DashboardPage() {
    const [workflows, setWorkflows] = useState<WorkflowDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true

        getWorkflows().then((data) => {
            if (active) setWorkflows(data)
        })
        .catch(() => {
            if (active) setError('Failed to load dashboard.')
        })
        .finally(() => {
            if (active) setLoading(false)
        })
    return () => {
        active = false
    }
    }, [])
    if (loading) return <div className="page">Loading dashboard...</div>

    if (error) {
        return <div className="page" role="alert">{error}</div>
    }

    const recentWorkflows = [...workflows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)

    return (
        <div className="page">
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview of your workflows and recent activity.</p>
            </div>

            <div className="dashboard-grid">
                <div className="stat-card">
                    <span>Total Workflows</span>
                    <strong>{workflows.length}</strong>
                </div>

                <div className="stat-card">
                    <span>Recently Updated (7 Days)</span>
                    <strong>
                        {workflows.filter((workflow) => new Date(workflow.updatedAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000).length}
                    </strong>
                </div>

                <div className="stat-card">
                    <span>Executions</span>
                    <strong>Not available yet</strong>
                </div>
            </div>

            <div className="page-header" style={{ marginTop: 32 }}>
                <h2>Recent Workflows</h2>
            </div>

            <div className="workflow-list">
                {recentWorkflows.length === 0 ? (
                    <p>No workflows created yet.</p>
                ) : (
                    recentWorkflows.map((workflow) => (
                        <Link key={workflow.id} to={`/workflows/${workflow.id}`} className="workflow-card">
                            <div>
                                <h3>{workflow.name}</h3>
                                <p>{workflow.description}</p>
                            </div>
                            <span>
                                {new Date(workflow.updatedAt).toLocaleDateString()}
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
export default DashboardPage;