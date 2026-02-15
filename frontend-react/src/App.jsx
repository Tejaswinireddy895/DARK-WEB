/**
 * ============================================
 * MAIN APP COMPONENT
 * Dark Web Threat Intelligence Dashboard
 * ============================================
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import TopHeader from './components/TopHeader'
import Dashboard from './pages/Dashboard'
import ThreatAnalyzer from './pages/ThreatAnalyzer'
import Report from './pages/Report'
import IntelligenceDB from './pages/IntelligenceDB'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import ThreatAlerts from './pages/ThreatAlerts'
import IntelligenceReport from './pages/IntelligenceReport'

// Protected Route wrapper - redirects to login if not authenticated
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen cyber-grid-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// Public Route wrapper - redirects to dashboard if already authenticated
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen cyber-grid-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

// Main Layout with Sidebar and Header
function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="cyber-grid-bg min-h-screen flex">
      {/* Left Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Header */}
        <TopHeader 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
        />
        
        {/* Page Content */}
        <main className="flex-1 p-6 relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}

// App Routes
function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes - Only accessible when NOT logged in */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Protected Routes - Only accessible when logged in */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout><Dashboard /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/analyzer" element={
        <ProtectedRoute>
          <MainLayout><ThreatAnalyzer /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/report" element={
        <ProtectedRoute>
          <MainLayout><Report /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/database" element={
        <ProtectedRoute>
          <MainLayout><IntelligenceDB /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute>
          <MainLayout><ThreatAlerts /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/case-file" element={
        <ProtectedRoute>
          <MainLayout><IntelligenceReport /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout><Settings /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout><Profile /></MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
