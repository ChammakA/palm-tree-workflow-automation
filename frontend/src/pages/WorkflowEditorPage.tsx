import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getWorkflowById, type WorkflowDto } from '../features/workflows/api/workflowApi'
import WorkflowCanvas from '../features/workflows/components/WorkflowCanvas'

function WorkflowEditorPage() {
    const { workflowId } = useParams()
    const [workflow, setWorkflow] = useState<WorkflowDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        async function loadWorkflow() {
            if (!workflowId) {
                setWorkflow(null)
                setError('Workflow ID is missing')
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)
            setWorkflow(null)

            try {
                const data = await getWorkflowById(workflowId)

                if (active) {
                    setWorkflow(data)
                }
            } catch (err) {
                if (active) {
                    setError(err instanceof Error ? err.message : 'Failed to load workflow.')
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }
        loadWorkflow()
        return () => {
            active = false
        }

    }, [workflowId])

    if (loading) {
        return <div className='page'>Loading workflow...</div>
    }

    if (error) {
        return (
            <div className="page">
                <h2>Unable to load workflow.</h2>
                <p>{error}</p>
                <Link to="/workflows">Back to Workflows</Link>
            </div>
        )
    }

    if (!workflow || !workflowId) {
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
            <WorkflowCanvas key={workflowId} workflowId={workflowId} />
        </div>
    )
}

export default WorkflowEditorPage