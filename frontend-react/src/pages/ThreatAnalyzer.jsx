/**
 * ============================================
 * THREAT ANALYZER PAGE
 * AI-powered content analysis interface
 * ============================================
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  ArrowRight,
  Brain,
  FileSearch,
  Shield,
  AlertTriangle,
  FileText,
  Globe,
  Target
} from 'lucide-react'
import InputAnalyzer from '../components/InputAnalyzer'
import GlowCard from '../components/GlowCard'
import RiskBadge, { CategoryBadge, KeywordTag } from '../components/RiskBadge'
import { analyzeText, saveToHistory, mapCategoryToSeverity, advancedAnalysis, getThreatLevelDisplay } from '../utils/api'

export default function ThreatAnalyzer() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [savedRecord, setSavedRecord] = useState(null)
  const [error, setError] = useState(null)
  const [analysisMode, setAnalysisMode] = useState('standard') // 'standard' or 'advanced'
  const [advancedResult, setAdvancedResult] = useState(null)

  // Handle analysis submission
  const handleAnalyze = async ({ text, model, source }) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setAdvancedResult(null)
    setSavedRecord(null)

    try {
      if (analysisMode === 'advanced') {
        // Advanced analysis with threat prioritization and report generation
        const response = await advancedAnalysis(text, model, source)
        
        // Save to history with enhanced data
        const record = saveToHistory({
          ...response.prediction,
          threat_level: response.threat_alert?.threat_level,
          alert_priority: response.threat_alert?.alert_priority,
          risk_score: response.threat_alert?.risk_score
        }, source, text)
        setSavedRecord(record)
        
        setAdvancedResult(response)
        setResult({
          ...response.prediction,
          id: record.id,
          severity: record.severity,
          originalText: text,
          source,
          analyzedAt: new Date().toISOString()
        })
      } else {
        // Standard analysis
        const response = await analyzeText(text, model)
        
        // Save to history
        const record = saveToHistory(response, source, text)
        setSavedRecord(record)
        
        const analysisResult = {
          ...response,
          id: record.id,
          severity: record.severity,
          originalText: text,
          source,
          analyzedAt: new Date().toISOString()
        }
        setResult(analysisResult)
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Navigate to full report
  const handleViewFullReport = () => {
    if (savedRecord) {
      navigate('/report', { state: { record: savedRecord } })
    }
  }

  // Navigate to intelligence report
  const handleViewCaseFile = () => {
    if (advancedResult?.intelligence_report) {
      navigate('/case-file', { state: { report: advancedResult.intelligence_report, record: savedRecord } })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500 to-cyber-700 
                        flex items-center justify-center shadow-glow">
          <Brain className="w-6 h-6 text-dark-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gradient">
            Threat Intelligence Analyzer
          </h1>
          <p className="text-text-secondary mt-0.5">
            AI-powered dark web content classification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div>
          {/* Analysis Mode Toggle */}
          <div className="mb-4 p-1 bg-card rounded-xl border border-cyber/10 inline-flex">
            <button
              onClick={() => setAnalysisMode('standard')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                         ${analysisMode === 'standard' 
                           ? 'bg-cyber-500 text-dark-500' 
                           : 'text-text-secondary hover:text-white'}`}
            >
              Standard
            </button>
            <button
              onClick={() => setAnalysisMode('advanced')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                         ${analysisMode === 'advanced' 
                           ? 'bg-cyber-500 text-dark-500' 
                           : 'text-text-secondary hover:text-white'}`}
            >
              <Target className="w-4 h-4" />
              Advanced Intel
            </button>
          </div>
          
          {analysisMode === 'advanced' && (
            <div className="mb-4 p-3 bg-cyber-500/10 border border-cyber-500/30 rounded-lg">
              <p className="text-sm text-cyber-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Advanced Mode Active</span>
              </p>
              <p className="text-xs text-text-muted mt-1">
                Includes: SOC-style threat prioritization • Cross-lingual analysis • Intelligence report generation
              </p>
            </div>
          )}
          
          <InputAnalyzer onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>

        {/* Right Column - Results Preview */}
        <div className="space-y-6">
          {/* Status Indicator */}
          <GlowCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <FileSearch className="w-5 h-5 text-cyber-500" />
              <h3 className="text-lg font-semibold text-white">Analysis Status</h3>
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-12"
                >
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-cyber-500 animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-cyber-500/20" />
                  </div>
                  <p className="text-text-secondary mt-4 text-sm">
                    Running AI analysis...
                  </p>
                  <div className="flex gap-1 mt-3">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-cyber-500"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-8 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-risk-critical/10 
                                  flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-risk-critical" />
                  </div>
                  <p className="text-risk-critical font-medium">Analysis Failed</p>
                  <p className="text-text-muted text-sm mt-2 max-w-xs">{error}</p>
                </motion.div>
              ) : result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Success indicator */}
                  <div className="flex items-center gap-2 text-risk-low mb-4">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Analysis Complete</span>
                  </div>

                  {/* Risk Score */}
                  <div className="flex items-center justify-between p-4 rounded-xl 
                                  bg-dark-500/50 border border-cyber/10">
                    <span className="text-text-secondary">Risk Level</span>
                    <RiskBadge level={result.severity || result.risk_level} size="lg" showIcon />
                  </div>

                  {/* Confidence Score */}
                  <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-secondary">Confidence</span>
                      <span className="text-cyber-500 font-bold">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-cyber-500 to-cyber-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Detected Category */}
                  <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                    <span className="text-text-muted text-sm block mb-2">
                      Detected Category
                    </span>
                    <CategoryBadge category={result.category} />
                  </div>

                  {/* Keywords */}
                  {result.keywords?.length > 0 && (
                    <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                      <span className="text-text-muted text-sm block mb-3">
                        Suspicious Keywords ({result.keywords.length})
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {result.keywords.slice(0, 8).map((keyword, index) => (
                          <KeywordTag key={index} keyword={keyword} variant="danger" />
                        ))}
                        {result.keywords.length > 8 && (
                          <span className="text-xs text-text-muted self-center">
                            +{result.keywords.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Advanced Analysis Results */}
                  {advancedResult && (
                    <>
                      {/* Threat Level Alert */}
                      {advancedResult.threat_alert && (
                        <div className={`p-4 rounded-xl border ${
                          getThreatLevelDisplay(advancedResult.threat_alert.threat_level?.level || 'LOW').borderClass
                        }/30 ${
                          getThreatLevelDisplay(advancedResult.threat_alert.threat_level?.level || 'LOW').bgClass
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-text-muted text-sm">Threat Priority</span>
                            <span className={`font-bold ${
                              getThreatLevelDisplay(advancedResult.threat_alert.threat_level?.level || 'LOW').textClass
                            }`}>
                              {advancedResult.threat_alert.threat_level?.emoji} {advancedResult.threat_alert.threat_level?.level}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">Alert Priority</span>
                            <span className="text-white">{advancedResult.threat_alert.alert_priority}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-text-muted">Risk Score</span>
                            <span className="text-white font-medium">
                              {advancedResult.threat_alert.risk_score?.toFixed(1)}/100
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-text-muted">Response Time</span>
                            <span className="text-white text-xs">
                              {advancedResult.threat_alert.suggested_response_time}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Cross-Lingual Analysis */}
                      {advancedResult.cross_lingual_analysis && (
                        <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                          <span className="text-text-muted text-sm flex items-center gap-2 mb-3">
                            <Globe className="w-4 h-4" />
                            Cross-Lingual Intelligence
                          </span>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-text-muted">Language</span>
                              <span className="text-white">
                                {advancedResult.cross_lingual_analysis.language?.name} 
                                ({Math.round(advancedResult.cross_lingual_analysis.language?.confidence * 100)}%)
                              </span>
                            </div>
                            {advancedResult.cross_lingual_analysis.slang_detected?.length > 0 && (
                              <div>
                                <span className="text-text-muted text-xs">Slang Detected:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {advancedResult.cross_lingual_analysis.slang_detected.slice(0, 4).map((s, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-dark-400 rounded">
                                      {s.term}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recommended Actions */}
                      {advancedResult.threat_alert?.recommended_actions?.length > 0 && (
                        <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                          <span className="text-text-muted text-sm block mb-3">
                            Recommended Actions
                          </span>
                          <ul className="space-y-2">
                            {advancedResult.threat_alert.recommended_actions.slice(0, 3).map((action, i) => (
                              <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                                <span className="text-cyber-500 mt-0.5">•</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* View Intelligence Report Button */}
                      <motion.button
                        onClick={handleViewCaseFile}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyber-500 to-cyber-600
                                   flex items-center justify-center gap-2
                                   text-dark-500 font-semibold hover:shadow-glow
                                   transition-all duration-300"
                      >
                        <FileText className="w-4 h-4" />
                        View Intelligence Report
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </>
                  )}

                  {/* View Full Report Button */}
                  <motion.button
                    onClick={handleViewFullReport}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl bg-card border border-cyber/20
                               flex items-center justify-center gap-2
                               text-cyber-500 font-medium hover:border-cyber/50
                               hover:bg-cyber-500/5 transition-all duration-300"
                  >
                    View Full Report
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-12 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-cyber-500/10 
                                  flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-cyber-500/50" />
                  </div>
                  <p className="text-text-secondary font-medium">
                    Ready for Analysis
                  </p>
                  <p className="text-text-muted text-sm mt-2 max-w-xs">
                    Enter content in the analyzer to begin threat detection
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlowCard>

          {/* Processing Time */}
          {result && (
            <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
              <span>
                Processing time: {(result.processing_time * 1000).toFixed(0)}ms
              </span>
              <span>•</span>
              <span>
                Model: {result.source === 'bert' ? 'BERT' : 'Baseline'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
