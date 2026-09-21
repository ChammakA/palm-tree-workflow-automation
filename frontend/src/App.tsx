import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom"
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/DashboardPage'
import WorkflowsPage from './pages/WorkflowsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="workflows" element={<WorkflowsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App