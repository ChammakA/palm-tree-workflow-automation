import type { Workflow } from '../types/workflow';

export const mockWorkflows: Workflow[] = [
    {
        id: 'purchase-approval',
        name: 'Purchase Approval',
        description: 'Routes purchase requests through the required approval process.',
        createdAt: '2023-01-15T10:00:00Z',
        updatedAt: '2023-01-20T15:30:00Z',
    },
    {
        id: 'employee-onboarding',
        name: 'Employee Onboarding',
        description: 'Coordinates tasks required when onboarding a new employee.',
        createdAt: '2023-02-01T09:00:00Z',
        updatedAt: '2023-02-05T14:45:00Z',
    }
]