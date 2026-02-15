/**
 * ============================================
 * SETTINGS PAGE
 * Application settings and preferences
 * ============================================
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon,
  Palette,
  Bell,
  Cpu,
  Globe,
  Zap,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GlowCard from '../components/GlowCard'

export default function Settings() {
  const { user, updateSettings, isAuthenticated } = useAuth()
  
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    default_model: 'bert',
    auto_analyze: false,
    language: 'en'
  })
  const [originalSettings, setOriginalSettings] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [hasChanges, setHasChanges] = useState(false)

  // Load user settings on mount
  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings)
      setOriginalSettings(user.settings)
    }
  }, [user])

  // Check for changes
  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
      setHasChanges(changed)
    }
  }, [settings, originalSettings])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setMessage({ type: '', text: '' })
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      // Save to localStorage for non-authenticated users
      localStorage.setItem('app_settings', JSON.stringify(settings))
      setOriginalSettings(settings)
      setMessage({ type: 'success', text: 'Settings saved locally!' })
      return
    }

    setIsLoading(true)
    setMessage({ type: '', text: '' })
    
    const result = await updateSettings(settings)
    
    setIsLoading(false)
    
    if (result.success) {
      setOriginalSettings(settings)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const handleReset = () => {
    if (originalSettings) {
      setSettings(originalSettings)
      setMessage({ type: '', text: '' })
    }
  }

  const themeOptions = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor }
  ]

  const modelOptions = [
    { value: 'baseline', label: 'Baseline (Fast)', description: 'Logistic Regression - Quick analysis' },
    { value: 'bert', label: 'BERT (Accurate)', description: 'DistilBERT - Higher accuracy' }
  ]

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' }
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-cyber-500" />
            Settings
          </h1>
          <p className="text-text-secondary mt-1">Configure your application preferences</p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-text-muted 
                         hover:bg-dark-400 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 text-sm bg-cyber-500 
                         text-dark-500 rounded-lg hover:bg-cyber-400 transition-colors
                         disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        )}
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

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Appearance</h3>
                  <p className="text-sm text-text-muted">Customize the look and feel</p>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-secondary">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleChange('theme', option.value)}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border 
                                  transition-all duration-300 ${
                        settings.theme === option.value
                          ? 'bg-cyber-500/10 border-cyber-500 text-cyber-500'
                          : 'bg-dark-400 border-cyber/10 text-text-secondary hover:border-cyber/30'
                      }`}
                    >
                      <option.icon className="w-5 h-5" />
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Notifications Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  <p className="text-sm text-text-muted">Manage alert preferences</p>
                </div>
              </div>

              {/* Notification Toggle */}
              <div className="flex items-center justify-between p-4 bg-dark-400/50 rounded-xl">
                <div>
                  <p className="font-medium text-white">Enable Notifications</p>
                  <p className="text-sm text-text-muted">Receive alerts for threat detections</p>
                </div>
                <button
                  onClick={() => handleChange('notifications', !settings.notifications)}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                    settings.notifications ? 'bg-cyber-500' : 'bg-dark-300'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg 
                                   transition-transform duration-300 ${
                    settings.notifications ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Analysis Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Analysis</h3>
                  <p className="text-sm text-text-muted">Configure AI model settings</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Default Model */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-text-secondary">Default Model</label>
                  <div className="grid gap-3">
                    {modelOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleChange('default_model', option.value)}
                        className={`flex items-center justify-between p-4 rounded-xl border 
                                    transition-all duration-300 text-left ${
                          settings.default_model === option.value
                            ? 'bg-cyber-500/10 border-cyber-500'
                            : 'bg-dark-400 border-cyber/10 hover:border-cyber/30'
                        }`}
                      >
                        <div>
                          <p className={`font-medium ${
                            settings.default_model === option.value ? 'text-cyber-500' : 'text-white'
                          }`}>
                            {option.label}
                          </p>
                          <p className="text-sm text-text-muted">{option.description}</p>
                        </div>
                        {settings.default_model === option.value && (
                          <CheckCircle className="w-5 h-5 text-cyber-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Analyze Toggle */}
                <div className="flex items-center justify-between p-4 bg-dark-400/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-white">Auto-Analyze</p>
                      <p className="text-sm text-text-muted">Automatically analyze pasted content</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleChange('auto_analyze', !settings.auto_analyze)}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                      settings.auto_analyze ? 'bg-cyber-500' : 'bg-dark-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg 
                                     transition-transform duration-300 ${
                      settings.auto_analyze ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Language Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlowCard>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Language</h3>
                  <p className="text-sm text-text-muted">Set your preferred language</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-secondary">Interface Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-3 bg-dark-400 rounded-xl border border-cyber/10
                             text-white focus:outline-none focus:border-cyber-500/50
                             transition-all duration-300 cursor-pointer"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* Floating Save Button (Mobile) */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden"
        >
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-3 bg-cyber-500 text-dark-500 
                       font-semibold rounded-full shadow-glow hover:bg-cyber-400 
                       transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </motion.div>
      )}
    </div>
  )
}
