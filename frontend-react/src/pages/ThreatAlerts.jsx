/**
 * ============================================
 * THREAT ALERTS PAGE
 * SOC-style threat prioritization dashboard
 * ============================================
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle,
  Shield,
  Clock,
  TrendingUp,
  Users,
  Activity,
  RefreshCw,
  ChevronRight,
  Filter,
  Bell,
  Target
} from 'lucide-react'
import GlowCard from '../components/GlowCard'
import { getAlertStats, getThreatLevelDisplay, getPriorityDisplay, getAnalysisHistory } from '../utils/api'

// Threat Level Badge Component
const ThreatLevelBadge = ({ level, size = 'normal' }) => {
  const display = getThreatLevelDisplay(level)
  const sizeClasses = size === 'large' 
    ? 'px-4 py-2 text-base' 
    : 'px-3 py-1 text-sm'
  
  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-medium
                      ${display.bgClass} ${display.textClass} ${sizeClasses}
                      border ${display.borderClass}`}>
      <span>{display.emoji}</span>
      <span>{level}</span>
    </span>
  )
}

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const display = getPriorityDisplay(priority)
  
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${display.color}`}>
      {display.urgent && <Bell className="w-3 h-3 animate-pulse" />}
      {display.label}
    </span>
  )
}

// Alert Card Component
const AlertCard = ({ alert, onClick }) => {
  const threatDisplay = getThreatLevelDisplay(alert.threat_level?.level || alert.severity)
  const priorityDisplay = getPriorityDisplay(alert.alert_priority || 'ROUTINE')
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300
                  bg-card hover:bg-card/80 ${threatDisplay.borderClass}/30
                  hover:${threatDisplay.borderClass}/50`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <ThreatLevelBadge level={alert.threat_level?.level || alert.severity} />
            <PriorityBadge priority={alert.alert_priority || 'ROUTINE'} />
          </div>
          
          <h4 className="font-medium text-white truncate mb-1">
            {alert.category}
          </h4>
          
          <p className="text-sm text-text-secondary line-clamp-2">
            {alert.preview || alert.text?.substring(0, 150) + '...'}
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Risk: {alert.risk_score || Math.round(alert.confidence * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(alert.date || alert.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
        
        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${threatDisplay.textClass}`} />
      </div>
    </motion.div>
  )
}

// Stats Card Component
const StatsCard = ({ icon: Icon, label, value, color, subtext }) => (
  <GlowCard className="p-4">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
        {subtext && <p className="text-xs text-text-muted mt-0.5">{subtext}</p>}
      </div>
    </div>
  </GlowCard>
)

export default function ThreatAlerts() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState({
    total_alerts_24h: 0,
    by_threat_level: { critical: 0, high: 0, watchlist: 0, low: 0 },
    by_priority: { immediate: 0, urgent: 0, elevated: 0, routine: 0 },
    active_vendors: 0,
    average_risk_score: 0
  })
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('all')

  // Load data
  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    
    try {
      // Get stats
      const statsData = await getAlertStats()
      setStats(statsData)
      
      // Get local analysis history and filter for threats
      const history = getAnalysisHistory()
      const threatAlerts = history
        .filter(r => r.severity !== 'SAFE' && r.severity !== 'LOW')
        .slice(0, 50)
      setAlerts(threatAlerts)
    } catch (error) {
      console.error('Failed to load alert data:', error)
    }
    
    setIsLoading(false)
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(), 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true
    return (alert.threat_level?.level || alert.severity)?.toLowerCase() === filter
  })

  // Handle alert click
  const handleAlertClick = (alert) => {
    navigate('/report', { state: { record: alert } })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cyber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 
                          flex items-center justify-center shadow-glow">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">
              Threat Alerts Dashboard
            </h1>
            <p className="text-text-secondary mt-0.5">
              SOC-style threat prioritization & monitoring
            </p>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-cyber/20 
                     rounded-lg text-text-secondary hover:text-white hover:border-cyber/40 
                     transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Priority Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={AlertTriangle}
          label="Critical Threats"
          value={stats.by_threat_level.critical}
          color="bg-red-500"
          subtext="Immediate attention required"
        />
        <StatsCard
          icon={Shield}
          label="High Risk"
          value={stats.by_threat_level.high}
          color="bg-orange-500"
          subtext="Priority investigation"
        />
        <StatsCard
          icon={Activity}
          label="Watchlist"
          value={stats.by_threat_level.watchlist}
          color="bg-yellow-500"
          subtext="Monitoring recommended"
        />
        <StatsCard
          icon={TrendingUp}
          label="Low Priority"
          value={stats.by_threat_level.low}
          color="bg-green-500"
          subtext="Standard processing"
        />
      </div>

      {/* Threat Level Summary */}
      <GlowCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-cyber-500" />
            Threat Level Overview
          </h3>
          <div className="text-sm text-text-secondary">
            <span className="text-white font-medium">{stats.total_alerts_24h}</span> alerts in 24h
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Critical */}
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🔴</span>
              <span className="text-red-500 font-semibold">CRITICAL</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.by_threat_level.critical}</p>
            <p className="text-xs text-text-muted mt-1">Within 15 mins</p>
          </div>
          
          {/* High */}
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🟠</span>
              <span className="text-orange-500 font-semibold">HIGH</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.by_threat_level.high}</p>
            <p className="text-xs text-text-muted mt-1">Within 1 hour</p>
          </div>
          
          {/* Watchlist */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🟡</span>
              <span className="text-yellow-500 font-semibold">WATCHLIST</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.by_threat_level.watchlist}</p>
            <p className="text-xs text-text-muted mt-1">Within 24 hours</p>
          </div>
          
          {/* Low */}
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🟢</span>
              <span className="text-green-500 font-semibold">LOW</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.by_threat_level.low}</p>
            <p className="text-xs text-text-muted mt-1">Standard queue</p>
          </div>
        </div>
      </GlowCard>

      {/* Response Priority Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlowCard className="p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyber-500" />
            Response Priority Queue
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-400">
              <span className="flex items-center gap-2 text-red-500">
                <Bell className="w-4 h-4 animate-pulse" />
                IMMEDIATE
              </span>
              <span className="text-white font-semibold">{stats.by_priority.immediate}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-400">
              <span className="flex items-center gap-2 text-orange-500">
                <Bell className="w-4 h-4" />
                URGENT
              </span>
              <span className="text-white font-semibold">{stats.by_priority.urgent}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-400">
              <span className="flex items-center gap-2 text-yellow-500">
                ELEVATED
              </span>
              <span className="text-white font-semibold">{stats.by_priority.elevated}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-400">
              <span className="flex items-center gap-2 text-green-500">
                ROUTINE
              </span>
              <span className="text-white font-semibold">{stats.by_priority.routine}</span>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyber-500" />
            Vendor Intelligence
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Active Vendors Tracked</span>
              <span className="text-white font-semibold">{stats.active_vendors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Avg Risk Score</span>
              <span className="text-white font-semibold">
                {stats.average_risk_score?.toFixed(1) || 0}/100
              </span>
            </div>
            <div className="pt-3 border-t border-cyber/10">
              <p className="text-xs text-text-muted">
                Vendor profiles are automatically built from detected contact information 
                (Telegram, Wickr, Email) and correlated across analyses.
              </p>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Alert Feed */}
      <GlowCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyber-500" />
            Recent Threat Alerts
          </h3>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-dark-400 text-white px-3 py-1.5 rounded-lg border border-cyber/20 
                         focus:border-cyber/40 focus:outline-none text-sm"
            >
              <option value="all">All Levels</option>
              <option value="critical">🔴 Critical</option>
              <option value="high">🟠 High</option>
              <option value="watchlist">🟡 Watchlist</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, index) => (
                <AlertCard 
                  key={alert.id || index} 
                  alert={alert} 
                  onClick={() => handleAlertClick(alert)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-cyber-500/30 mx-auto mb-3" />
                <p className="text-text-secondary">No alerts matching filter</p>
                <p className="text-text-muted text-sm mt-1">
                  Analyze content in Threat Analyzer to generate alerts
                </p>
              </div>
            )}
          </div>
        </AnimatePresence>
      </GlowCard>
    </div>
  )
}
