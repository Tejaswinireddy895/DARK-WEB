/**
 * ============================================
 * AUTHENTICATION CONTEXT
 * Global auth state management with JWT
 * ============================================
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Storage keys
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

// API instance for auth
const authApi = axios.create({
  baseURL: '/api/auth',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      // Set default auth header
      authApi.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setLoading(false)
  }, [])

  // Register new user
  const register = useCallback(async (email, password, name) => {
    setError(null)
    try {
      const response = await authApi.post('/register', { email, password, name })
      const { access_token, user: userData } = response.data

      // Store token and user
      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      
      setToken(access_token)
      setUser(userData)
      authApi.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      return { success: true, user: userData }
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  // Login user
  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const response = await authApi.post('/login', { email, password })
      const { access_token, user: userData } = response.data

      // Store token and user
      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      
      setToken(access_token)
      setUser(userData)
      authApi.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      return { success: true, user: userData }
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  // Logout user
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    delete authApi.defaults.headers.common['Authorization']
  }, [])

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    if (!token) return null

    try {
      const response = await authApi.get('/me')
      const userData = response.data
      
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch (err) {
      // Token might be expired
      if (err.response?.status === 401) {
        logout()
      }
      return null
    }
  }, [token, logout])

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    setError(null)
    try {
      const response = await authApi.put('/profile', updates)
      const userData = response.data
      
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      const message = err.response?.data?.detail || 'Update failed'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  // Update settings
  const updateSettings = useCallback(async (settings) => {
    setError(null)
    try {
      const response = await authApi.put('/settings', settings)
      const userData = response.data
      
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } catch (err) {
      const message = err.response?.data?.detail || 'Update failed'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  // Change password
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    setError(null)
    try {
      await authApi.put('/password', { 
        old_password: oldPassword, 
        new_password: newPassword 
      })
      return { success: true }
    } catch (err) {
      const message = err.response?.data?.detail || 'Password change failed'
      setError(message)
      return { success: false, error: message }
    }
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    refreshUser,
    updateProfile,
    updateSettings,
    changePassword,
    clearError: () => setError(null)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
