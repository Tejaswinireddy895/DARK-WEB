/**
 * ============================================
 * PROFILE PAGE
 * User profile display and editing
 * ============================================
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GlowCard from '../components/GlowCard'

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()
  
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    avatar: user?.avatar || ''
  })
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    setMessage({ type: '', text: '' })
    
    const result = await updateProfile(profileData)
    
    setIsLoading(false)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    
    setIsLoading(true)
    setMessage({ type: '', text: '' })
    
    const result = await changePassword(passwordData.oldPassword, passwordData.newPassword)
    
    setIsLoading(false)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setShowPasswordForm(false)
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const cancelEdit = () => {
    setProfileData({ name: user?.name || '', avatar: user?.avatar || '' })
    setIsEditing(false)
    setMessage({ type: '', text: '' })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-text-muted">Please log in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-text-secondary mt-1">Manage your account information</p>
        </div>
      </motion.div>

      {/* Message Alert */}
      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-3 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-risk-low/10 border-risk-low/20 text-risk-low' 
              : 'bg-risk-critical/10 border-risk-critical/20 text-risk-critical'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm">{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="ml-auto hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <GlowCard>
            <div className="p-6 text-center">
              {/* Avatar */}
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyber-500 to-cyber-700 
                              flex items-center justify-center shadow-glow">
                <User className="w-12 h-12 text-dark-500" />
              </div>
              
              {/* Name */}
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-text-secondary">{user.email}</p>
              
              {/* Role Badge */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full 
                              bg-cyber-500/10 border border-cyber/20">
                <Shield className="w-4 h-4 text-cyber-500" />
                <span className="text-sm font-medium text-cyber-500 capitalize">
                  {user.role}
                </span>
              </div>
              
              {/* Member Since */}
              <div className="mt-6 pt-6 border-t border-cyber/10">
                <div className="flex items-center justify-center gap-2 text-text-muted">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    Member since {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Profile Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Edit Profile Section */}
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-cyber-500 
                               hover:bg-cyber-500/10 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted 
                                 hover:bg-dark-400 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-cyber-500 
                                 text-dark-500 rounded-lg hover:bg-cyber-400 transition-colors
                                 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 bg-dark-400 rounded-xl border border-cyber/10
                                 text-white focus:outline-none focus:border-cyber-500/50
                                 transition-all duration-300"
                    />
                  ) : (
                    <p className="px-4 py-3 bg-dark-400/50 rounded-xl text-white">
                      {user.name}
                    </p>
                  )}
                </div>

                {/* Email Field (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-dark-400/50 rounded-xl">
                    <Mail className="w-5 h-5 text-text-muted" />
                    <span className="text-white">{user.email}</span>
                    <span className="ml-auto text-xs text-text-muted">(cannot be changed)</span>
                  </div>
                </div>

                {/* Role Field (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Role
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-dark-400/50 rounded-xl">
                    <Shield className="w-5 h-5 text-text-muted" />
                    <span className="text-white capitalize">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Change Password Section */}
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Security</h3>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-cyber-500 
                               hover:bg-cyber-500/10 rounded-lg transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm ? (
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="oldPassword"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 pr-12 bg-dark-400 rounded-xl border border-cyber/10
                                   text-white focus:outline-none focus:border-cyber-500/50
                                   transition-all duration-300"
                        placeholder="Enter current password"
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

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 bg-dark-400 rounded-xl border border-cyber/10
                                 text-white focus:outline-none focus:border-cyber-500/50
                                 transition-all duration-300"
                      placeholder="Enter new password"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 bg-dark-400 rounded-xl border border-cyber/10
                                 text-white focus:outline-none focus:border-cyber-500/50
                                 transition-all duration-300"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
                        setMessage({ type: '', text: '' })
                      }}
                      className="px-6 py-2.5 text-sm text-text-muted hover:bg-dark-400 
                                 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-2.5 text-sm bg-cyber-500 
                                 text-dark-500 rounded-lg hover:bg-cyber-400 transition-colors
                                 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Update Password
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-text-muted text-sm">
                  Last password change: Never
                </p>
              )}
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </div>
  )
}
