/**
 * ============================================
 * DASHBOARD PAGE
 * Real-time metrics, charts, and alerts
 * ============================================
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Activity, 
  AlertTriangle, 
  Shield, 
  Zap,
  RefreshCw,
  TrendingUp,
  Database
} from 'lucide-react'
import MetricCard from '../components/MetricCard'
import GlowCard from '../components/GlowCard'
import DataTable from '../components/DataTable'
import { LineChartPanel, BarChartPanel } from '../components/ChartPanel'
import { 
  checkHealth, 
  getMetrics, 
  calculateStats, 
  getAnalysisHistory 
} from '../utils/api'

// Table columns for recent alerts
const alertColumns = [
  { key: 'id', label: 'ID', type: 'id', sortable: true },
  { key: 'preview', label: 'Content Preview', type: 'preview' },
  { key: 'category', label: 'Category', type: 'category', sortable: true },
  { key: 'severity', label: 'Severity', type: 'risk', sortable: true },
  { key: 'date', label: 'Detected', type: 'date', sortable: true },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiStatus, setApiStatus] = useState({ status: 'checking', model_loaded: false })
  const [modelMetrics, setModelMetrics] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    todayCount: 0,
    threats: 0,
    critical: 0,
    high: 0,
    safe: 0,
    categoryDistribution: [],
    dailyTrend: [],
    recentAlerts: []
  })

  // Load dashboard data
  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    
    try {
      // Check API health
      const health = await checkHealth()
      setApiStatus(health)
      
      // Get model metrics if model is loaded
      if (health.model_loaded) {
        const metrics = await getMetrics()
        setModelMetrics(metrics)
      }
    } catch (error) {
      setApiStatus({ status: 'offline', model_loaded: false })
    }
    
    // Calculate local stats from history
    const localStats = calculateStats()
    setStats(localStats)
    
    setIsLoading(false)
    setIsRefreshing(false)
  }, [])

  // Initial load and periodic refresh
  useEffect(() => {
    loadData()
    
    // Refresh every 30 seconds
    const interval = setInterval(() => loadData(), 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Handle manual refresh
  const handleRefresh = () => loadData(true)

  // Handle view alert details
  const handleViewDetails = (record) => {
    navigate('/report', { state: { record } })
  }

  // Prepare chart data
  const trendData = stats.dailyTrend.length > 0 
    ? stats.dailyTrend.map(d => ({
        name: d.date,
        threats: d.threats,
        total: d.total
      }))
    : [
        { name: 'Mon', threats: 0, total: 0 },
        { name: 'Tue', threats: 0, total: 0 },
        { name: 'Wed', threats: 0, total: 0 },
        { name: 'Thu', threats: 0, total: 0 },
        { name: 'Fri', threats: 0, total: 0 },
        { name: 'Sat', threats: 0, total: 0 },
        { name: 'Sun', threats: 0, total: 0 },
      ]

  const categoryData = stats.categoryDistribution.length > 0
    ? stats.categoryDistribution
    : [{ name: 'No Data', value: 0 }]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-cyber-500 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">
            Threat Intelligence Dashboard
          </h1>
          <p className="text-text-secondary mt-1">
            Real-time monitoring and analysis overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* API Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                          ${apiStatus.status === 'healthy' 
                            ? 'bg-risk-low/10 text-risk-low' 
                            : 'bg-risk-critical/10 text-risk-critical'}`}>
            <span className={`w-2 h-2 rounded-full ${
              apiStatus.status === 'healthy' ? 'bg-risk-low' : 'bg-risk-critical'
            } animate-pulse`} />
            API {apiStatus.status === 'healthy' ? 'Online' : 'Offline'}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card 
                       border border-cyber/20 text-text-secondary hover:text-white
                       hover:border-cyber/40 transition-all duration-300
                       disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          icon={Activity}
          label="Total Analyses"
          value={stats.total.toLocaleString()}
          change={stats.todayCount > 0 ? `+${stats.todayCount} today` : 'No scans today'}
          changeType={stats.todayCount > 0 ? 'increase' : 'neutral'}
          color="cyber"
          delay={0}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Threats Detected"
          value={stats.threats}
          change={stats.critical > 0 ? `${stats.critical} critical` : 'None critical'}
          changeType={stats.critical > 0 ? 'increase' : 'neutral'}
          color="red"
          delay={0.1}
        />
        <MetricCard
          icon={Zap}
          label="High Risk"
          value={stats.high + stats.critical}
          change={`${stats.high} high priority`}
          changeType={stats.high > 0 ? 'increase' : 'neutral'}
          color="yellow"
          delay={0.2}
        />
        <MetricCard
          icon={Shield}
          label="Safe Content"
          value={stats.safe}
          change={stats.total > 0 
            ? `${((stats.safe / stats.total) * 100).toFixed(0)}% safe rate` 
            : 'No data'}
          changeType="decrease"
          color="green"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <LineChartPanel
          data={trendData}
          title="Analysis Activity (7 Days)"
          subtitle="Daily scan and threat detection trend"
          dataKey="threats"
          xAxisKey="name"
          height={280}
        />
        <BarChartPanel
          data={categoryData}
          title="Category Distribution"
          subtitle="Content categorization breakdown"
          dataKey="value"
          xAxisKey="name"
          height={280}
          horizontal={true}
        />
      </div>

      {/* Recent Alerts Table */}
      <GlowCard
        title="Recent Threat Alerts"
        subtitle="Latest detected threats requiring attention"
        headerAction={
          stats.recentAlerts.length > 0 ? (
            <span className="text-xs text-risk-critical bg-risk-critical/10 
                             px-2 py-1 rounded-full animate-pulse">
              {stats.recentAlerts.filter(a => a.severity === 'CRITICAL').length} Critical
            </span>
          ) : null
        }
        noPadding
      >
        {stats.recentAlerts.length > 0 ? (
          <DataTable
            columns={alertColumns}
            data={stats.recentAlerts}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <div className="p-12 text-center">
            <Database className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No threat alerts yet</p>
            <p className="text-text-muted text-sm mt-1">
              Analyze content in the Threat Analyzer to see alerts here
            </p>
            <button
              onClick={() => navigate('/analyzer')}
              className="mt-4 px-4 py-2 bg-cyber-500 text-dark-500 rounded-lg font-medium
                         hover:shadow-glow transition-all duration-300"
            >
              Start Analyzing
            </button>
          </div>
        )}
      </GlowCard>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Model Type', 
            value: modelMetrics?.model_type || apiStatus.model_type || 'N/A', 
            color: 'text-cyber-500' 
          },
          { 
            label: 'Model Accuracy', 
            value: modelMetrics?.accuracy 
              ? `${(modelMetrics.accuracy * 100).toFixed(1)}%` 
              : 'N/A', 
            color: 'text-risk-low' 
          },
          { 
            label: 'Categories', 
            value: modelMetrics?.num_categories || 0, 
            color: 'text-risk-medium' 
          },
          { 
            label: 'History Size', 
            value: getAnalysisHistory().length, 
            color: 'text-text-secondary' 
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="bg-card/50 rounded-xl p-4 border border-cyber/5"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-text-muted mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
