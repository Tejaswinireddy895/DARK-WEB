/**
 * ============================================
 * REPORT PAGE
 * Detailed analysis report view
 * ============================================
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Clock, 
  Tag,
  AlertTriangle,
  Copy,
  ArrowLeft,
  Brain
} from 'lucide-react'
import GlowCard from '../components/GlowCard'
import RiskBadge, { CategoryBadge, KeywordTag } from '../components/RiskBadge'

export default function Report() {
  const location = useLocation()
  const navigate = useNavigate()
  const record = location.state?.record

  // If no record, show empty state
  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyber-500/10 
                        flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-cyber-500/50" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No Report Selected</h2>
        <p className="text-text-secondary mb-6 max-w-md">
          Analyze content in the Threat Analyzer to generate a report, 
          or select a record from the Intelligence Database.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/analyzer')}
            className="px-4 py-2 bg-cyber-500 text-dark-500 rounded-lg font-medium
                       hover:shadow-glow transition-all duration-300"
          >
            Go to Analyzer
          </button>
          <button
            onClick={() => navigate('/database')}
            className="px-4 py-2 bg-card border border-cyber/20 text-text-secondary 
                       rounded-lg hover:text-white hover:border-cyber/40 transition-all"
          >
            View Database
          </button>
        </div>
      </div>
    )
  }

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(record.fullText || record.preview)
  }

  // Download report as JSON
  const handleDownload = () => {
    const reportData = {
      id: record.id,
      source: record.source,
      category: record.category,
      severity: record.severity,
      confidence: record.confidence,
      keywords: record.keywords,
      probabilities: record.probabilities,
      content: record.fullText || record.preview,
      analyzedAt: record.date,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `threat-report-${record.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Format probabilities for display
  const sortedProbabilities = record.probabilities 
    ? Object.entries(record.probabilities)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 7)
    : []

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Report Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glow-card p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyber-500 to-cyber-700 
                            flex items-center justify-center shadow-glow flex-shrink-0">
              <FileText className="w-7 h-7 text-dark-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-white">
                  Threat Analysis Report
                </h1>
                <RiskBadge level={record.severity} size="md" showIcon />
              </div>
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(record.date).toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {record.source}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2.5 rounded-lg bg-dark-400 border border-cyber/10
                         text-text-muted hover:text-white hover:border-cyber/30
                         transition-all duration-300"
              title="Copy content"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg
                         bg-cyber-500 text-dark-500 font-medium
                         hover:shadow-glow transition-all duration-300"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Source & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Preview */}
          <GlowCard title="Analyzed Content" subtitle="Original text submitted for analysis">
            <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10 font-mono text-sm">
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {record.fullText || record.preview}
              </p>
            </div>
          </GlowCard>

          {/* Classification Probabilities */}
          {sortedProbabilities.length > 0 && (
            <GlowCard 
              title="Category Probabilities" 
              subtitle="AI confidence distribution across categories"
            >
              <div className="space-y-3">
                {sortedProbabilities.map(([category, probability], index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <span className="w-32 text-sm text-text-secondary truncate">
                      {category}
                    </span>
                    <div className="flex-1 h-2.5 bg-dark-400 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${probability * 100}%` }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        className={`h-full rounded-full ${
                          index === 0 
                            ? 'bg-gradient-to-r from-cyber-500 to-cyber-400' 
                            : 'bg-cyber-500/30'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-mono w-14 text-right ${
                      index === 0 ? 'text-cyber-500 font-medium' : 'text-text-muted'
                    }`}>
                      {(probability * 100).toFixed(1)}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          )}
        </div>

        {/* Right Column - Metadata & Keywords */}
        <div className="space-y-6">
          {/* Classification Result */}
          <GlowCard title="Classification" subtitle="AI detection result">
            <div className="space-y-4">
              {/* Category */}
              <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                <p className="text-xs text-text-muted mb-2">Detected Category</p>
                <CategoryBadge category={record.category} />
              </div>

              {/* Confidence */}
              <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                <div className="flex justify-between mb-2">
                  <p className="text-xs text-text-muted">Confidence Score</p>
                  <span className="text-cyber-500 font-bold">
                    {(record.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${record.confidence * 100}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-cyber-500 to-cyber-400 rounded-full"
                  />
                </div>
              </div>

              {/* Risk Level */}
              <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                <p className="text-xs text-text-muted mb-2">Threat Level</p>
                <div className="flex items-center justify-between">
                  <RiskBadge level={record.severity} size="lg" showIcon />
                  {record.severity !== 'SAFE' && (
                    <AlertTriangle className="w-5 h-5 text-risk-high animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Keywords */}
          {record.keywords?.length > 0 && (
            <GlowCard 
              title="Suspicious Keywords" 
              subtitle={`${record.keywords.length} indicators detected`}
            >
              <div className="flex flex-wrap gap-2">
                {record.keywords.map((keyword, index) => (
                  <motion.div
                    key={keyword}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <KeywordTag keyword={keyword} variant="danger" />
                  </motion.div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* Metadata */}
          <GlowCard title="Report Metadata">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Report ID</span>
                <span className="text-text-secondary font-mono">{record.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Source</span>
                <span className="text-text-secondary">{record.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Model</span>
                <span className="text-text-secondary">{record.modelUsed || 'baseline'}</span>
              </div>
              {record.processingTime && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Processing Time</span>
                  <span className="text-text-secondary">
                    {(record.processingTime * 1000).toFixed(0)}ms
                  </span>
                </div>
              )}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  )
}
