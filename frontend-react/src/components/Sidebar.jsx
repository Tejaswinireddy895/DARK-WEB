/**
 * ============================================
 * SIDEBAR COMPONENT
 * Left vertical navigation with icons + labels
 * ============================================
 */

import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Database, 
  Shield,
  Settings,
  User,
  AlertTriangle,
  Globe,
  FileWarning
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Navigation items configuration
const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & Analytics' },
  { path: '/analyzer', icon: Search, label: 'Threat Analyzer', description: 'AI Content Analysis' },
  { path: '/alerts', icon: AlertTriangle, label: 'Threat Alerts', description: 'SOC Priority Queue' },
  { path: '/case-file', icon: FileWarning, label: 'Case Files', description: 'Intelligence Reports' },
  { path: '/report', icon: FileText, label: 'Reports', description: 'Analysis Reports' },
  { path: '/database', icon: Database, label: 'Intelligence DB', description: 'Threat Database' },
]

const bottomNavItems = [
  { path: '/profile', icon: User, label: 'Profile', requiresAuth: true },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen }) {
  const { isAuthenticated } = useAuth()
  
  // Filter bottom items based on auth status
  const visibleBottomItems = bottomNavItems.filter(
    item => !item.requiresAuth || isAuthenticated
  )
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-card to-dark-500 
                  border-r border-cyber/10 z-50 flex flex-col transition-all duration-300
                  ${isOpen ? 'w-64' : 'w-20'}`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-cyber/10">
        <div className="flex items-center gap-3">
          {/* Shield Icon with Glow */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-500 to-cyber-700 
                          flex items-center justify-center shadow-glow">
            <Shield className="w-5 h-5 text-dark-500" />
          </div>
          
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <h1 className="font-bold text-white text-sm">DARK WEB</h1>
              <p className="text-cyber-500 text-xs font-medium">Threat Intelligence</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <p className={`text-text-muted text-xs uppercase tracking-wider mb-4 
                       ${isOpen ? 'px-3' : 'text-center'}`}>
          {isOpen ? 'Main Menu' : '•••'}
        </p>
        
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              group relative flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-300 cursor-pointer
              ${isActive 
                ? 'bg-cyber-500/15 text-cyber-500 border-l-4 border-cyber-500' 
                : 'text-text-secondary hover:bg-cyber-500/5 hover:text-white'
              }
            `}
          >
            {({ isActive }) => (
              <>
                {/* Icon */}
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300
                                       ${isActive ? 'text-cyber-500' : 'group-hover:text-cyber-400'}`} />
                
                {/* Label */}
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1"
                  >
                    <p className="font-medium text-sm">{item.label}</p>
                    {isActive && (
                      <p className="text-xs text-text-muted">{item.description}</p>
                    )}
                  </motion.div>
                )}

                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-cyber-500/5 -z-10"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-cyber/10">
        {visibleBottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-300
              ${isActive 
                ? 'bg-cyber-500/15 text-cyber-500' 
                : 'text-text-muted hover:bg-cyber-500/5 hover:text-white'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
            {isOpen && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* System Status Indicator */}
      {isOpen && (
        <div className="p-4 mx-4 mb-4 rounded-xl bg-cyber-500/10 border border-cyber-500/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
            <span className="text-xs text-text-secondary">System Online</span>
          </div>
          <p className="text-xs text-text-muted mt-1">All services operational</p>
        </div>
      )}
    </motion.aside>
  )
}
