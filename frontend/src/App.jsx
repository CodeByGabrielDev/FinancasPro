import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import AddTransactionPage from './pages/AddTransactionPage'
import NotificationsPage from './pages/NotificationsPage'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Rotas protegidas */}
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index                  element={<DashboardPage />} />
          <Route path="transactions"    element={<TransactionsPage />} />
          <Route path="add"             element={<AddTransactionPage />} />
          <Route path="notifications"   element={<NotificationsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
