/**
 * ============================================
 * REGISTER PAGE
 * New user account creation
 * ============================================
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Mail, 
  Lock, 
  User,
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register, error, clearError } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Password requirements
  const passwordChecks = [
    { label: 'At least 6 characters', valid: formData.password.length >= 6 },
    { label: 'Contains a number', valid: /\d/.test(formData.password) },
    { label: 'Passwords match', valid: formData.password && formData.password === formData.confirmPassword }
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
    clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill in all fields')
      return
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match')
      return
    }

    setIsLoading(true)

    const result = await register(formData.email, formData.password, formData.name)
    
    setIsLoading(false)

    if (result.success) {
      navigate('/', { replace: true })
    } else {
      setFormError(result.error)
    }
  }

  return (
    <div className="min-h-screen cyber-grid-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyber-500 to-cyber-700 
                          flex items-center justify-center shadow-glow">
            <Shield className="w-8 h-8 text-dark-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-text-secondary">Join Dark Web Threat Intelligence</p>
        </div>

        {/* Register Form */}
        <div className="bg-card border border-cyber/10 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {(formError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-risk-critical/10 border border-risk-critical/20 
                           rounded-xl text-risk-critical"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{formError || error}</span>
              </motion.div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 bg-dark-400 rounded-xl border border-cyber/10
                             text-white placeholder:text-text-muted
                             focus:outline-none focus:border-cyber-500/50 focus:shadow-glow-sm
                             transition-all duration-300"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="analyst@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-dark-400 rounded-xl border border-cyber/10
                             text-white placeholder:text-text-muted
                             focus:outline-none focus:border-cyber-500/50 focus:shadow-glow-sm
                             transition-all duration-300"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full pl-12 pr-12 py-3 bg-dark-400 rounded-xl border border-cyber/10
                             text-white placeholder:text-text-muted
                             focus:outline-none focus:border-cyber-500/50 focus:shadow-glow-sm
                             transition-all duration-300"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted 
                             hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full pl-12 pr-4 py-3 bg-dark-400 rounded-xl border border-cyber/10
                             text-white placeholder:text-text-muted
                             focus:outline-none focus:border-cyber-500/50 focus:shadow-glow-sm
                             transition-all duration-300"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2">
              {passwordChecks.map((check, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {check.valid ? (
                    <CheckCircle className="w-4 h-4 text-risk-low" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-text-muted" />
                  )}
                  <span className={check.valid ? 'text-risk-low' : 'text-text-muted'}>
                    {check.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-cyber-600 to-cyber-500 
                         hover:from-cyber-500 hover:to-cyber-400
                         text-dark-500 font-semibold rounded-xl
                         flex items-center justify-center gap-2
                         transition-all duration-300 shadow-glow
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cyber/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-text-muted">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="block w-full py-3 text-center text-cyber-500 hover:text-cyber-400
                       border border-cyber/20 hover:border-cyber/40 rounded-xl
                       transition-all duration-300"
          >
            Sign In Instead
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-sm mt-6">
          Dark Web Threat Intelligence System v1.0.0
        </p>
      </motion.div>
    </div>
  )
}
