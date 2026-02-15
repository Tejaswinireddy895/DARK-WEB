/**
 * ============================================
 * TOP HEADER COMPONENT
 * Horizontal header with search, notifications, profile
 * ============================================
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Search, 
  Bell, 
  User, 
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  UserCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function TopHeader({ onToggleSidebar, sidebarOpen }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Sample notifications
  const notifications = [
    { id: 1, type: 'critical', message: 'High-risk content detected', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'New threat pattern identified', time: '15 min ago' },
    { id: 3, type: 'info', message: 'Analysis complete: 5 items', time: '1 hour ago' },
  ]

  const handleLogout = () => {
    logout()
    setShowProfile(false)
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-dark-500/80 backdrop-blur-xl 
                       border-b border-cyber/10 flex items-center justify-between px-6">
      {/* Left Section - Toggle & Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-cyber-500/10 text-text-secondary 
                     hover:text-white transition-all duration-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search threats, reports, intelligence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 pl-10 pr-4 py-2.5 bg-card rounded-xl border border-cyber/10
                       text-sm text-white placeholder:text-text-muted
                       focus:outline-none focus:border-cyber-500/50 focus:shadow-glow-sm
                       transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted 
                         hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3">
        {/* Live Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full 
                        bg-risk-low/10 border border-risk-low/20">
          <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
          <span className="text-xs font-medium text-risk-low">LIVE</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-card hover:bg-card-hover
                       border border-cyber/10 hover:border-cyber/30
                       transition-all duration-300"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-risk-critical 
                             rounded-full flex items-center justify-center
                             text-xs font-bold text-white animate-pulse">
              3
            </span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 top-full mt-2 w-80 bg-card border border-cyber/20 
                         rounded-xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-cyber/10">
                <h3 className="font-semibold text-white">Notifications</h3>
                <p className="text-xs text-text-muted">3 unread alerts</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 border-b border-cyber/5 hover:bg-cyber-500/5 
                               transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                        notif.type === 'critical' ? 'bg-risk-critical' :
                        notif.type === 'warning' ? 'bg-risk-medium' : 'bg-cyber-500'
                      }`} />
                      <div>
                        <p className="text-sm text-white">{notif.message}</p>
                        <p className="text-xs text-text-muted mt-1">{notif.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-dark-400">
                <button className="w-full py-2 text-sm text-cyber-500 hover:text-cyber-400 
                                   transition-colors">
                  View All Notifications
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-card 
                           hover:bg-card-hover border border-cyber/10 hover:border-cyber/30
                           transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-500 to-cyber-700 
                                flex items-center justify-center">
                  <User className="w-4 h-4 text-dark-500" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-text-muted capitalize">{user?.role || 'Analyst'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-card border border-cyber/20 
                             rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-cyber/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-500 to-cyber-700 
                                      flex items-center justify-center">
                        <User className="w-5 h-5 text-dark-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user?.name}</p>
                        <p className="text-xs text-text-muted">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary
                                 hover:bg-cyber-500/5 hover:text-white transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary
                                 hover:bg-cyber-500/5 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>
                  
                  <div className="border-t border-cyber/10 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-risk-critical
                                 hover:bg-risk-critical/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl 
                         bg-gradient-to-r from-cyber-600 to-cyber-500 
                         hover:from-cyber-500 hover:to-cyber-400
                         text-dark-500 font-medium text-sm
                         transition-all duration-300 shadow-glow"
            >
              <User className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Click outside handler */}
      {(showNotifications || showProfile) && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={() => {
            setShowNotifications(false)
            setShowProfile(false)
          }}
        />
      )}
    </header>
  )
}
