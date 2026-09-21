function DashboardPage() {
    return (
        <div className="page">
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview of your workflows and recent activities.</p>
            </div>

            <div className="dashboard-grid">
                <div className="stat-card">
                    <span>Total Workflows</span>
                    <strong>0</strong>
                </div>
            </div>

            <div className="stat-card">
                <span>Active Workflows</span>
                <strong>0</strong>
            </div>

            <div className="stat-card">
                <span>Executions</span>
                <strong>0</strong>
            </div>
        </div>
    )
}

export default DashboardPage