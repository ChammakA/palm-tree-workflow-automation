import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getWorkflows, createWorkflow, type WorkflowDto } from '../features/workflows/api/workflowApi'

function WorkflowsPage() {
    const [workflows, setWorkflows] = useState<WorkflowDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate()
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        let active = true

        async function loadWorkflows() {
            try {
                const data = await getWorkflows()
                if (active) {
                    setWorkflows(data)
                }
            } catch {
                if (active) {
                    setError('Unable to load workflows.')
                }
            } finally {
                if (active) {
                    setLoading(false)
                }
            }
        }

        loadWorkflows()
        return () => {
            active = false
        }
    }, [])

    const handleCreateWorkflow = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!name.trim() || creating) return
        
        setCreating(true)
        setError(null)

        try {
            const workflow = await createWorkflow(name.trim(), description.trim())
            navigate(`/workflows/${workflow.id}`)
        } catch {
            setError('Failed to create workflow.')
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return <div className="page">Loading workflows...</div>
    }
    if (error) {
        return <div className="page">Error: {error}</div>
    }

    return (
        <div className="page">
            <div className="page-header page-header-row">
                <div>
                    <h2>Workflows</h2>
                    <p>Create and manage your automated workflows.</p>
                </div>
                <button type="button" className="primary-button" onClick={() => setShowCreateForm(true)}>
                    New Workflow
                </button>
            </div>

            {showCreateForm && (
                <form className="create-workflow-form" onSubmit={handleCreateWorkflow}>
                    <h3>Create Workflow</h3>
                    <div className='form-group'>
                        <label htmlFor='workflow-name'>Workflow Name</label>
                        <input id="workflow-name" value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. Purchase Approval' required/>
                    </div>

                    <div className='form-group'>
                        <label htmlFor='workflow-description'>Description</label>
                        <textarea id='workflow-description' value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Describe what this workflow does.' rows={3}/>
                    </div>

                    <div className='create-workflow-actions'>
                        <button type='button' onClick={() => setShowCreateForm(false)}>
                            Cancel
                        </button>

                        <button type='submit' className='primary-button' disabled={creating}>
                            {creating ? 'Creating...' : 'Create Workflow'}
                        </button>
                    </div>
                </form>
            )}

            <div className="workflow-list">
                {workflows.map((workflow) => (
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