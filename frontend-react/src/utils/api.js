/**
 * ============================================
 * API UTILITY SERVICE
 * Axios-based API communication layer for real-time data
 * ============================================
 */

import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Request failed'
    console.error('[API Error]', message)
    return Promise.reject(new Error(message))
  }
)

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Check API health status
 * @returns {Promise<{status: string, model_loaded: boolean, model_type: string, version: string}>}
 */
export const checkHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

/**
 * Analyze text for cyber crime content
 * @param {string} text - The text to analyze
 * @param {string} modelType - Model type ('bert' or 'baseline')
 * @returns {Promise<PredictionResult>}
 */
export const analyzeText = async (text, modelType = 'baseline') => {
  const response = await api.post('/predict', { 
    text, 
    model_type: modelType 
  })
  return response.data
}

/**
 * Batch analyze multiple texts
 * @param {string[]} texts - Array of texts to analyze
 * @param {string} modelType - Model type
 * @returns {Promise<{predictions: PredictionResult[], count: number}>}
 */
export const batchAnalyze = async (texts, modelType = 'baseline') => {
  const response = await api.post('/predict/batch', { 
    texts, 
    model_type: modelType 
  })
  return response.data
}

/**
 * Get model performance metrics
 * @returns {Promise<MetricsResponse>}
 */
export const getMetrics = async () => {
  const response = await api.get('/metrics')
  return response.data
}

/**
 * Get available categories and risk levels
 * @returns {Promise<{categories: string[], risk_levels: string[]}>}
 */
export const getCategories = async () => {
  const response = await api.get('/categories')
  return response.data
}

/**
 * Get database status
 * @returns {Promise<{connected: boolean, database: string}>}
 */
export const getDatabaseStatus = async () => {
  const response = await api.get('/database/status')
  return response.data
}

// ============================================================================
// ADVANCED INTELLIGENCE ANALYSIS API
// ============================================================================

/**
 * Perform advanced threat analysis with prioritization, cross-lingual, and report generation
 * @param {string} text - Text to analyze
 * @param {string} modelType - Model type
 * @param {string} source - Content source
 * @returns {Promise<AdvancedAnalysisResult>}
 */
export const advancedAnalysis = async (text, modelType = 'baseline', source = 'Manual Input') => {
  const response = await api.post('/analyze/advanced', {
    text,
    model_type: modelType,
    include_report: true,
    include_cross_lingual: true,
    source
  })
  return response.data
}

/**
 * Prioritize a threat and get SOC-style alert
 * @param {string} text - Text to analyze
 * @param {string} modelType - Model type
 * @returns {Promise<ThreatAlert>}
 */
export const prioritizeThreat = async (text, modelType = 'baseline') => {
  const response = await api.post('/analyze/prioritize', {
    text,
    model_type: modelType
  })
  return response.data
}

/**
 * Get alert statistics for dashboard
 * @returns {Promise<AlertStats>}
 */
export const getAlertStats = async () => {
  try {
    const response = await api.get('/alerts/stats')
    return response.data
  } catch {
    return {
      total_alerts_24h: 0,
      by_threat_level: { critical: 0, high: 0, watchlist: 0, low: 0 },
      by_priority: { immediate: 0, urgent: 0, elevated: 0, routine: 0 },
      active_vendors: 0,
      average_risk_score: 0
    }
  }
}

/**
 * Perform cross-lingual analysis
 * @param {string} text - Text to analyze
 * @returns {Promise<CrossLingualAnalysis>}
 */
export const analyzeCrossLingual = async (text) => {
  const response = await api.post('/analyze/cross-lingual', {
    text,
    model_type: 'baseline'
  })
  return response.data
}

/**
 * Generate intelligence report
 * @param {string} text - Text to analyze
 * @param {string} modelType - Model type
 * @param {string} source - Content source
 * @returns {Promise<IntelligenceReport>}
 */
export const generateReport = async (text, modelType = 'baseline', source = 'Manual Input') => {
  const response = await api.post('/analyze/report', {
    text,
    model_type: modelType,
    source
  })
  return response.data
}

/**
 * Generate formatted text report for export
 * @param {string} text - Text to analyze
 * @param {string} modelType - Model type
 * @param {string} source - Content source
 * @returns {Promise<{report_id: string, case_number: string, text_report: string}>}
 */
export const generateTextReport = async (text, modelType = 'baseline', source = 'Manual Input') => {
  const response = await api.post('/analyze/report/text', {
    text,
    model_type: modelType,
    source
  })
  return response.data
}

// ============================================================================
// THREAT LEVEL UTILITIES
// ============================================================================

/**
 * Get threat level display properties
 * @param {string} level - Threat level (CRITICAL, HIGH, WATCHLIST, LOW)
 * @returns {{emoji: string, color: string, bgClass: string, textClass: string}}
 */
export const getThreatLevelDisplay = (level) => {
  const levels = {
    'CRITICAL': {
      emoji: '🔴',
      color: '#ff1744',
      bgClass: 'bg-red-500/20',
      textClass: 'text-red-500',
      borderClass: 'border-red-500'
    },
    'HIGH': {
      emoji: '🟠',
      color: '#ff9100',
      bgClass: 'bg-orange-500/20',
      textClass: 'text-orange-500',
      borderClass: 'border-orange-500'
    },
    'WATCHLIST': {
      emoji: '🟡',
      color: '#ffea00',
      bgClass: 'bg-yellow-500/20',
      textClass: 'text-yellow-500',
      borderClass: 'border-yellow-500'
    },
    'LOW': {
      emoji: '🟢',
      color: '#00e676',
      bgClass: 'bg-green-500/20',
      textClass: 'text-green-500',
      borderClass: 'border-green-500'
    }
  }
  return levels[level] || levels['LOW']
}

/**
 * Get priority level display properties
 * @param {string} priority - Priority level
 * @returns {{label: string, color: string, urgent: boolean}}
 */
export const getPriorityDisplay = (priority) => {
  const priorities = {
    'IMMEDIATE': { label: 'Immediate', color: 'text-red-500', urgent: true },
    'URGENT': { label: 'Urgent', color: 'text-orange-500', urgent: true },
    'ELEVATED': { label: 'Elevated', color: 'text-yellow-500', urgent: false },
    'ROUTINE': { label: 'Routine', color: 'text-green-500', urgent: false }
  }
  return priorities[priority] || priorities['ROUTINE']
}

/**
 * Get server-side analysis history
 * @param {number} limit - Max records to fetch
 * @returns {Promise<{history: AnalysisRecord[], count: number}>}
 */
export const getServerHistory = async (limit = 100) => {
  try {
    const token = localStorage.getItem('auth_token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const response = await api.get(`/history?limit=${limit}`, { headers })
    return response.data
  } catch {
    return { history: [], count: 0 }
  }
}

/**
 * Get server-side analysis statistics
 * @returns {Promise<{total_analyses: number, by_category: object, by_risk_level: object}>}
 */
export const getServerStats = async () => {
  try {
    const response = await api.get('/history/stats')
    return response.data
  } catch {
    return { total_analyses: 0, by_category: {}, by_risk_level: {} }
  }
}

/**
 * Delete analysis from server
 * @param {string} analysisId - Analysis ID to delete
 */
export const deleteServerAnalysis = async (analysisId) => {
  const token = localStorage.getItem('auth_token')
  if (!token) throw new Error('Not authenticated')
  
  const response = await api.delete(`/history/${analysisId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

/**
 * Clear all server-side history
 */
export const clearServerHistory = async () => {
  const token = localStorage.getItem('auth_token')
  if (!token) throw new Error('Not authenticated')
  
  const response = await api.delete('/history', {
    headers: { Authorization: `Bearer ${token}` }
  })
  return response.data
}

// ============================================================================
// LOCAL STORAGE FOR ANALYSIS HISTORY
// ============================================================================

const HISTORY_KEY = 'analysis_history'
const MAX_HISTORY = 100

/**
 * Get analysis history from local storage
 * @returns {AnalysisRecord[]}
 */
export const getAnalysisHistory = () => {
  try {
    const data = localStorage.getItem(HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Save analysis result to history
 * @param {object} result - Analysis result
 * @param {string} source - Content source
 * @param {string} text - Original text
 * @returns {AnalysisRecord}
 */
export const saveToHistory = (result, source, text) => {
  const history = getAnalysisHistory()
  
  const record = {
    id: generateId(),
    source,
    preview: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
    fullText: text,
    category: result.category,
    severity: mapCategoryToSeverity(result.category, result.confidence),
    confidence: result.confidence,
    keywords: result.keywords || [],
    probabilities: result.all_probabilities || {},
    date: new Date().toISOString(),
    modelUsed: result.model_type || 'baseline',
    processingTime: result.processing_time
  }
  
  // Add to beginning, keep max entries
  history.unshift(record)
  if (history.length > MAX_HISTORY) {
    history.pop()
  }
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  return record
}

/**
 * Clear analysis history
 */
export const clearHistory = () => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]))
}

/**
 * Delete a record from history
 * @param {string} id - Record ID to delete
 */
export const deleteFromHistory = (id) => {
  const history = getAnalysisHistory().filter(r => r.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

/**
 * Get a single record by ID
 * @param {string} id - Record ID
 * @returns {AnalysisRecord|null}
 */
export const getRecordById = (id) => {
  return getAnalysisHistory().find(r => r.id === id) || null
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID
 * @returns {string}
 */
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * Map category and confidence to severity level
 * @param {string} category 
 * @param {number} confidence 
 * @returns {string}
 */
export const mapCategoryToSeverity = (category, confidence) => {
  const normalCategories = ['Normal', 'normal', 'Safe', 'NORMAL']
  
  if (normalCategories.includes(category)) {
    return 'SAFE'
  }
  
  if (confidence >= 0.9) return 'CRITICAL'
  if (confidence >= 0.75) return 'HIGH'
  if (confidence >= 0.5) return 'MEDIUM'
  return 'LOW'
}

/**
 * Get risk color class
 * @param {string} severity 
 * @returns {string}
 */
export const getRiskColor = (severity) => {
  const colors = {
    'CRITICAL': 'text-risk-critical',
    'HIGH': 'text-risk-high',
    'MEDIUM': 'text-risk-medium',
    'LOW': 'text-risk-low',
    'SAFE': 'text-risk-low',
  }
  return colors[severity] || 'text-text-secondary'
}

/**
 * Format confidence as percentage
 * @param {number} confidence 
 * @returns {string}
 */
export const formatConfidence = (confidence) => {
  return `${(confidence * 100).toFixed(1)}%`
}

/**
 * Format date for display
 * @param {string|Date} date 
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate dashboard statistics from history
 * @returns {DashboardStats}
 */
export const calculateStats = () => {
  const history = getAnalysisHistory()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const todayRecords = history.filter(r => new Date(r.date) >= today)
  const weekRecords = history.filter(r => new Date(r.date) >= weekAgo)
  
  const threats = history.filter(r => r.severity !== 'SAFE')
  const critical = history.filter(r => r.severity === 'CRITICAL')
  const high = history.filter(r => r.severity === 'HIGH')
  const safe = history.filter(r => r.severity === 'SAFE')
  
  // Category distribution
  const categoryCount = {}
  history.forEach(r => {
    categoryCount[r.category] = (categoryCount[r.category] || 0) + 1
  })
  
  // Daily trend (last 7 days)
  const dailyTrend = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
    const dayRecords = history.filter(r => {
      const d = new Date(r.date)
      return d >= date && d < nextDate
    })
    dailyTrend.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total: dayRecords.length,
      threats: dayRecords.filter(r => r.severity !== 'SAFE').length
    })
  }
  
  return {
    total: history.length,
    todayCount: todayRecords.length,
    weekCount: weekRecords.length,
    threats: threats.length,
    critical: critical.length,
    high: high.length,
    safe: safe.length,
    categoryDistribution: Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    })),
    dailyTrend,
    recentAlerts: history.filter(r => r.severity !== 'SAFE').slice(0, 10)
  }
}

export default api
