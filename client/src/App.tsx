import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './store'
import { getCurrentUser } from './store/slices/authSlice'

// Layout components
import Layout from './components/Layout'
import AuthLayout from './components/AuthLayout'

// Page components
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import EventsList from './pages/events/EventsList'
import EventDetail from './pages/events/EventDetail'
import CreateEvent from './pages/events/CreateEvent'
import EditEvent from './pages/events/EditEvent'
import RegistrationsList from './pages/registrations/RegistrationsList'
import RegistrationDetail from './pages/registrations/RegistrationDetail'
import CheckIn from './pages/checkin/CheckIn'
import CommunicationsList from './pages/communications/CommunicationsList'
import CreateCommunication from './pages/communications/CreateCommunication'
import Analytics from './pages/analytics/Analytics'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth)

  // If there's a token but not authenticated, try to get current user
  const dispatch = useDispatch()
  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser())
    }
  }, [token, isAuthenticated, dispatch])

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public route component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Main App Component with Layout
const AppWithLayout: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<EventsList />} />
        <Route path="/events/new" element={<CreateEvent />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/edit" element={<EditEvent />} />
        <Route path="/registrations" element={<RegistrationsList />} />
        <Route path="/registrations/:id" element={<RegistrationDetail />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/communications" element={<CommunicationsList />} />
        <Route path="/communications/new" element={<CreateCommunication />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        } />

        <Route path="/register" element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        } />

        {/* Protected routes with Layout */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppWithLayout />
          </ProtectedRoute>
        } />

        {/* 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App