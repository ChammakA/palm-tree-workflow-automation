import { useEffect, useState } from "react";
import { getWorkflowExecutions, decideWorkflowExecution, type WorkflowExecutionDto } from "../api/workflowApi";

interface Props {
    workflowId: string
    refreshKey: number
}

interface ExecutionStep {
    nodeId: string
    nodeType: string
    status: string
    conditionResult?: boolean | null
    variables?: Record<string, string>
    executedAt: string
}

function parseSteps(json: string): ExecutionStep[] {
    try {
        const value: unknown = JSON.parse(json)
        return Array.isArray(value) ? value as ExecutionStep[] : []
    } catch {
        return []
    }
}

export default function ExecutionHistory({workflowId, refreshKey}: Props) {
    const [executions, setExecutions] = useState<WorkflowExecutionDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [decidingId, setDecidingId] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        async function loadHistory() {
            setLoading(true)
            setError(null)

            try {
                const data = await getWorkflowExecutions(workflowId)

                if (active) setExecutions(data)
            } catch {
                if (active) {
                    setError('Failed to load execution history.')
                }
            } finally {
                if (active) setLoading(false)
            }
        }
        loadHistory()
        return () => {
            active = false
        }
    }, [workflowId, refreshKey])

    const handleDecision = async (executionId: string, approved: boolean) => {
        if (decidingId) return

        setDecidingId(executionId)
        setError(null)

        try {
            await decideWorkflowExecution(workflowId, executionId, approved)
            const updated = await getWorkflowExecutions(workflowId)
            setExecutions(updated)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to submit approval decision.')
        } finally {
            setDecidingId(null)
        }
    }

    return (
        <section className="execution-history">
            <h3>Execution History</h3>

            {loading && <p>Loading executions...</p>}
            {error && <p role="alert">{error}</p>}

            {!loading && !error && executions.length === 0 && (
                <p>No executions yet. Run your workflow to get started.</p>
            )}

            {!loading && !error && executions.map(execution => {
                const steps = parseSteps(execution.stepsJson)

                return (
                    <details key={execution.id} className="execution-history-item">
                        <summary>
                            <strong>{execution.status}</strong>
                            <span>
                                {new Date(execution.startedAt).toLocaleString()}
                            </span>
                            <span>{steps.length} steps</span>
                        </summary>

                        <div className="execution-history-details">
                            <p>
                                <strong>Execution ID:</strong>{' '}
                                {execution.id}
                            </p>

                            {execution.completedAt && (
                                <p>
                                    <strong>Finished:</strong>
                                    {new Date(execution.completedAt).toLocaleString()}
                                </p>
                            )}

                            {execution.errorMessage && (
                                <p className="execution-error">
                                    {execution.errorMessage}
                                </p>
                            )}

                            {execution.status === 'WaitingForApproval' && (
                                <div className="approval-actions">
                                    <p>This workflow is waiting for your decision.</p>

                                    <button type="button" className="approval-approve-button" disabled={decidingId !== null} onClick={() => handleDecision(execution.id, true)}>
                                        {decidingId === execution.id ? 'Processing...' : 'Approve'}
                                    </button>

                                    <button type="button" className="approval-reject-button" disabled={decidingId !== null} onClick={() => handleDecision(execution.id, false)}>
                                        Reject
                                    </button>
                                </div>
                            )}

                            <h4>Executed Nodes</h4>
                            {steps.length === 0 && (
                                <p>No completed steps recored.</p>
                            )}

                            {steps.map((step, index) => (
                                <div key={`${step.nodeId}-${index}`} className="execution-step">
                                    <strong>
                                        {index + 1}. {step.nodeType}
                                    </strong>

                                    <span>{step.status}</span>

                                    {step.conditionResult != null && (
                                        <p>
                                            Condition result:{' '}
                                            {String(step.conditionResult)}
                                        </p>
                                    )}

                                    {step.variables && (
                                        <pre>
                                            {JSON.stringify(step.variables, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    </details>
                )
            })}
        </section>
    )
}