/**
 * ============================================
 * INTELLIGENCE REPORT PAGE
 * Police-style case file report view
 * ============================================
 */

import { useState } from 'react'
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
  Brain,
  Shield,
  Target,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Globe,
  FileWarning
} from 'lucide-react'
import GlowCard from '../components/GlowCard'
import RiskBadge, { CategoryBadge, KeywordTag } from '../components/RiskBadge'
import { generateReport, generateTextReport, getThreatLevelDisplay, getPriorityDisplay } from '../utils/api'

// Section Header Component
const SectionHeader = ({ icon: Icon, title, classification }) => (
  <div className="flex items-center justify-between border-b border-cyber/20 pb-3 mb-4">
    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
      <Icon className="w-5 h-5 text-cyber-500" />
      {title}
    </h3>
    {classification && (
      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded font-mono">
        {classification}
      </span>
    )}
  </div>
)

// Evidence Item Component
const EvidenceItem = ({ evidence, index }) => {
  const relevanceColors = {
    HIGH: 'text-red-500 bg-red-500/10 border-red-500/30',
    MEDIUM: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    LOW: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
  }
  
  return (
    <div className={`p-3 rounded-lg border ${relevanceColors[evidence.relevance] || relevanceColors.LOW}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium">
          {evidence.id || `EV-${String(index + 1).padStart(3, '0')}`}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${evidence.relevance === 'HIGH' ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/20 text-gray-400'}`}>
          {evidence.relevance}
        </span>
      </div>
      <p className="text-sm text-white font-medium mb-1">
        {evidence.type?.toUpperCase()}: {evidence.value}
      </p>
      <p className="text-xs text-text-muted">{evidence.context}</p>
    </div>
  )
}

// Action Item Component
const ActionItem = ({ action, index, isUrgent }) => (
  <div className={`flex items-start gap-3 p-3 rounded-lg 
                   ${isUrgent ? 'bg-red-500/10 border border-red-500/30' : 'bg-dark-400'}`}>
    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                      ${isUrgent ? 'bg-red-500 text-white' : 'bg-cyber-500/20 text-cyber-500'}`}>
      {index + 1}
    </span>
    <p className={`text-sm ${isUrgent ? 'text-red-400' : 'text-text-secondary'}`}>{action}</p>
  </div>
)

export default function IntelligenceReportPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState(location.state?.report || null)
  const [textReport, setTextReport] = useState(null)
  const [error, setError] = useState(null)
  
  // Get record from navigation state
  const record = location.state?.record

  // Generate report from record
  const handleGenerateReport = async () => {
    if (!record?.fullText && !record?.preview) {
      setError('No content available to generate report')
      return
    }
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const reportData = await generateReport(
        record.fullText || record.preview,
        record.modelUsed || 'baseline',
        record.source || 'Intelligence DB'
      )
      setReport(reportData)
    } catch (err) {
      setError(err.message || 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  // Download text report
  const handleDownloadReport = async () => {
    if (!record?.fullText && !record?.preview) return
    
    try {
      const data = await generateTextReport(
        record.fullText || record.preview,
        record.modelUsed || 'baseline',
        record.source || 'Intelligence DB'
      )
      
      const blob = new Blob([data.text_report], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `intelligence-report-${data.case_number}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download report')
    }
  }

  // Copy report to clipboard
  const handleCopyReport = () => {
    if (textReport) {
      navigator.clipboard.writeText(textReport)
    }
  }

  // If no record and no report, show empty state
  if (!record && !report) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyber-500/10 
                        flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-cyber-500/50" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No Report Available</h2>
        <p className="text-text-secondary mb-6 max-w-md">
          Analyze content in the Threat Analyzer and select "Generate Report" 
          to create an intelligence case file.
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

  // If we have a record but no report yet
  if (record && !report) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500 to-cyber-700 
                          flex items-center justify-center shadow-glow">
            <FileWarning className="w-6 h-6 text-dark-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">
              Generate Intelligence Report
            </h1>
            <p className="text-text-secondary mt-0.5">
              Create a police-style case file from analysis
            </p>
          </div>
        </div>

        {/* Preview Card */}
        <GlowCard className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <CategoryBadge category={record.category} />
              <RiskBadge level={record.severity} className="ml-2" />
            </div>
            <span className="text-sm text-text-muted">
              ID: {record.id}
            </span>
          </div>
          
          <p className="text-text-secondary mb-4">{record.preview || record.fullText}</p>
          
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(record.date).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-4 h-4" />
              {Math.round(record.confidence * 100)}% confidence
            </span>
          </div>
        </GlowCard>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-cyber-500 text-dark-500 
                       rounded-xl font-semibold hover:shadow-glow transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Intelligence Report
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-center">
            {error}
          </div>
        )}
      </div>
    )
  }

  // Full report view
  const threatLevel = getThreatLevelDisplay(report.risk_level)

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
      <GlowCard className="p-6 border-t-4 border-cyber-500">
        <div className="text-center mb-6">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-2">
            {report.classification}
          </p>
          <h1 className="text-2xl font-bold text-white mb-1">INTELLIGENCE REPORT</h1>
          <p className="text-cyber-500 font-mono">{report.case_number}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-text-muted">Report ID</p>
            <p className="text-white font-mono">{report.report_id}</p>
          </div>
          <div>
            <p className="text-text-muted">Date</p>
            <p className="text-white">{new Date(report.report_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-text-muted">Status</p>
            <p className="text-yellow-500">{report.status}</p>
          </div>
          <div>
            <p className="text-text-muted">Analyst</p>
            <p className="text-white">{report.analyst_id}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-cyber/10">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-cyber/20 
                       rounded-lg text-text-secondary hover:text-white hover:border-cyber/40 
                       transition-all text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-3 py-2 bg-cyber-500 text-dark-500 
                       rounded-lg font-medium transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </GlowCard>

      {/* Executive Summary */}
      <GlowCard className="p-5">
        <SectionHeader icon={FileText} title="Executive Summary" />
        <p className="text-text-secondary leading-relaxed">{report.executive_summary}</p>
      </GlowCard>

      {/* Threat Assessment */}
      <GlowCard className={`p-5 border-l-4 ${threatLevel.borderClass}`}>
        <SectionHeader icon={AlertTriangle} title="Threat Assessment" />
        
        <div className="flex items-center gap-4 mb-4">
          <span className={`text-4xl`}>{threatLevel.emoji}</span>
          <div>
            <p className={`text-2xl font-bold ${threatLevel.textClass}`}>{report.risk_level}</p>
            <p className="text-text-muted text-sm">Threat Level</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-white">
              {Math.round(report.category_confidence * 100)}%
            </p>
            <p className="text-text-muted text-sm">Confidence</p>
          </div>
        </div>
        
        <p className="text-text-secondary">{report.threat_assessment}</p>
      </GlowCard>

      {/* Classification Results */}
      <GlowCard className="p-5">
        <SectionHeader icon={Target} title="Classification Results" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-text-muted text-sm mb-2">Primary Category</p>
            <CategoryBadge category={report.primary_category} />
          </div>
          <div>
            <p className="text-text-muted text-sm mb-2">Secondary Categories</p>
            <div className="flex flex-wrap gap-2">
              {report.secondary_categories?.length > 0 ? (
                report.secondary_categories.map(cat => (
                  <span key={cat} className="px-2 py-1 bg-dark-400 rounded text-sm text-text-secondary">
                    {cat}
                  </span>
                ))
              ) : (
                <span className="text-text-muted text-sm">None identified</span>
              )}
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Key Indicators */}
      <GlowCard className="p-5">
        <SectionHeader icon={Tag} title="Key Indicators" classification="EVIDENCE" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.key_indicators?.length > 0 ? (
            report.key_indicators.map((evidence, index) => (
              <EvidenceItem key={evidence.id || index} evidence={evidence} index={index} />
            ))
          ) : (
            <p className="text-text-muted col-span-2 text-center py-4">No key indicators identified</p>
          )}
        </div>
        
        {report.supporting_evidence?.length > 0 && (
          <>
            <h4 className="text-sm font-medium text-text-muted mt-6 mb-3">Supporting Evidence</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.supporting_evidence.map((evidence, index) => (
                <EvidenceItem key={evidence.id || index} evidence={evidence} index={index} />
              ))}
            </div>
          </>
        )}
      </GlowCard>

      {/* Intelligence Assessment */}
      <GlowCard className="p-5">
        <SectionHeader icon={Brain} title="Intelligence Assessment" />
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-cyber-500 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Likely Activity
            </h4>
            <p className="text-text-secondary">{report.intelligence_assessment?.likely_activity}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-cyber-500 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Modus Operandi
            </h4>
            <p className="text-text-secondary">{report.intelligence_assessment?.modus_operandi}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-cyber-500 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Actor Profile
            </h4>
            <p className="text-text-secondary">{report.intelligence_assessment?.actor_profile}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-cyber-500 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Geographic Indicators
            </h4>
            <div className="flex flex-wrap gap-2">
              {report.intelligence_assessment?.geographic_indicators?.map(geo => (
                <span key={geo} className="px-3 py-1 bg-dark-400 rounded-full text-sm text-text-secondary">
                  <Globe className="w-3 h-3 inline mr-1" />
                  {geo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Recommended Actions */}
      <GlowCard className="p-5">
        <SectionHeader icon={CheckCircle} title="Recommended Actions" />
        
        <div className="flex items-center justify-between mb-4 p-3 bg-dark-400 rounded-lg">
          <div>
            <p className="text-text-muted text-sm">Priority Level</p>
            <p className={`font-semibold ${threatLevel.textClass}`}>
              {report.recommendations?.priority_level}
            </p>
          </div>
          <div className="text-right">
            <p className="text-text-muted text-sm">Response Timeline</p>
            <p className="text-white font-medium">
              <Clock className="w-4 h-4 inline mr-1" />
              {report.recommendations?.response_timeline}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          {report.recommendations?.suggested_actions?.map((action, index) => (
            <ActionItem 
              key={index} 
              action={action} 
              index={index}
              isUrgent={action.includes('IMMEDIATE') || action.includes('PRIORITY')}
            />
          ))}
        </div>
      </GlowCard>

      {/* Content Sample */}
      <GlowCard className="p-5">
        <SectionHeader icon={FileText} title="Content Sample" classification="RESTRICTED" />
        
        <div className="flex items-center gap-4 text-sm text-text-muted mb-3">
          <span>Source: {report.content_source}</span>
          <span>Hash: <code className="font-mono">{report.content_hash}</code></span>
        </div>
        
        <div className="p-4 bg-dark-400 rounded-lg border border-cyber/10">
          <pre className="text-text-secondary text-sm whitespace-pre-wrap font-mono">
            {report.content_preview}
          </pre>
        </div>
      </GlowCard>

      {/* Footer */}
      <div className="text-center text-xs text-text-muted py-4 border-t border-cyber/10">
        <p>Generated by AI Investigator Report Generator</p>
        <p className="font-mono mt-1">{new Date().toISOString()}</p>
      </div>
    </div>
  )
}
