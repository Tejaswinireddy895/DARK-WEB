/**
 * ============================================
 * INTELLIGENCE DATABASE PAGE
 * Searchable/filterable table of analyzed content
 * ============================================
 */

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Database, 
  Search, 
  Download, 
  Trash2,
  X,
  RefreshCw,
  ChevronDown,
  AlertTriangle
} from 'lucide-react'
import GlowCard from '../components/GlowCard'
import DataTable, { TablePagination } from '../components/DataTable'
import RiskBadge, { CategoryBadge } from '../components/RiskBadge'
import { 
  getAnalysisHistory, 
  deleteFromHistory, 
  clearHistory 
} from '../utils/api'

// Table columns configuration
const columns = [
  { key: 'id', label: 'ID', type: 'id', sortable: true },
  { key: 'source', label: 'Source', sortable: true },
  { key: 'preview', label: 'Content Preview', type: 'preview' },
  { key: 'category', label: 'Category', type: 'category', sortable: true },
  { key: 'severity', label: 'Severity', type: 'risk', sortable: true },
  { key: 'date', label: 'Date', type: 'date', sortable: true },
]

// Filter options (will be populated from data)
const severityOptions = ['All Severity', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE']

export default function IntelligenceDB() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [severityFilter, setSeverityFilter] = useState('All Severity')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const itemsPerPage = 10

  // Load data from history
  const loadData = () => {
    const history = getAnalysisHistory()
    setData(history)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Get unique categories from data
  const categoryOptions = useMemo(() => {
    const categories = new Set(data.map(d => d.category))
    return ['All Categories', ...Array.from(categories)]
  }, [data])

  // Filter and search data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.preview?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = categoryFilter === 'All Categories' || 
        item.category === categoryFilter
      
      const matchesSeverity = severityFilter === 'All Severity' || 
        item.severity === severityFilter

      return matchesSearch && matchesCategory && matchesSeverity
    })
  }, [data, searchQuery, categoryFilter, severityFilter])

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Handle view details
  const handleViewDetails = (item) => {
    setSelectedItem(item)
  }

  // Navigate to full report
  const handleViewFullReport = () => {
    if (selectedItem) {
      navigate('/report', { state: { record: selectedItem } })
    }
  }

  // Delete single record
  const handleDelete = (id) => {
    deleteFromHistory(id)
    loadData()
    setSelectedItem(null)
  }

  // Clear all history
  const handleClearAll = () => {
    clearHistory()
    loadData()
    setShowClearConfirm(false)
  }

  // Export all data as JSON
  const handleExport = () => {
    const exportData = {
      records: filteredData,
      exportedAt: new Date().toISOString(),
      totalRecords: filteredData.length
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `intelligence-database-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Close modal
  const closeModal = () => {
    setSelectedItem(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-500 to-cyber-700 
                          flex items-center justify-center shadow-glow">
            <Database className="w-6 h-6 text-dark-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">
              Intelligence Database
            </h1>
            <p className="text-text-secondary mt-0.5">
              {filteredData.length} of {data.length} records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-2.5 rounded-xl bg-card border border-cyber/20 text-text-secondary
                       hover:text-white hover:border-cyber/40 transition-all duration-300"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExport}
            disabled={data.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-card border border-cyber/20 text-text-secondary
                       hover:text-white hover:border-cyber/40 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button 
            onClick={() => setShowClearConfirm(true)}
            disabled={data.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-risk-critical/10 border border-risk-critical/20 text-risk-critical
                       hover:bg-risk-critical/20 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <GlowCard>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search by content, source, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-dark-500 rounded-xl border border-cyber/10
                         text-white placeholder:text-text-muted
                         focus:outline-none focus:border-cyber-500/50 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none w-full md:w-48 px-4 py-2.5 pr-10 bg-dark-500 
                         rounded-xl border border-cyber/10 text-white
                         focus:outline-none focus:border-cyber-500/50 transition-colors cursor-pointer"
            >
              {categoryOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="appearance-none w-full md:w-40 px-4 py-2.5 pr-10 bg-dark-500 
                         rounded-xl border border-cyber/10 text-white
                         focus:outline-none focus:border-cyber-500/50 transition-colors cursor-pointer"
            >
              {severityOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* Clear Filters */}
          {(searchQuery || categoryFilter !== 'All Categories' || severityFilter !== 'All Severity') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('All Categories')
                setSeverityFilter('All Severity')
                setCurrentPage(1)
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                         text-text-muted hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </GlowCard>

      {/* Data Table */}
      <GlowCard noPadding>
        {data.length > 0 ? (
          <>
            <DataTable
              columns={columns}
              data={paginatedData}
              onViewDetails={handleViewDetails}
            />
            
            {/* Pagination */}
            {totalPages > 1 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredData.length}
              />
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <Database className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No records in database</p>
            <p className="text-text-muted text-sm mt-1">
              Analyze content in the Threat Analyzer to populate the database
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

      {/* Statistics Footer */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Records', value: data.length, color: 'text-cyber-500' },
            { label: 'Critical', value: data.filter(d => d.severity === 'CRITICAL').length, color: 'text-risk-critical' },
            { label: 'High Risk', value: data.filter(d => d.severity === 'HIGH').length, color: 'text-risk-high' },
            { label: 'Safe', value: data.filter(d => d.severity === 'SAFE').length, color: 'text-risk-low' },
            { label: 'Categories', value: new Set(data.map(d => d.category)).size, color: 'text-text-secondary' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card/50 rounded-xl p-4 border border-cyber/5 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-text-muted mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-500/80 backdrop-blur-sm z-50 
                       flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-cyber/20 rounded-2xl shadow-2xl 
                         max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-cyber/10">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    Record #{selectedItem.id?.slice(-6)}
                    <RiskBadge level={selectedItem.severity} size="sm" />
                  </h2>
                  <p className="text-sm text-text-muted mt-0.5">
                    {new Date(selectedItem.date).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-cyber-500/10 text-text-muted 
                             hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4">
                {/* Source & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                    <p className="text-xs text-text-muted mb-1">Source</p>
                    <p className="text-white font-medium">{selectedItem.source}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                    <p className="text-xs text-text-muted mb-1">Category</p>
                    <CategoryBadge category={selectedItem.category} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                  <p className="text-xs text-text-muted mb-2">Content</p>
                  <p className="text-text-secondary text-sm font-mono leading-relaxed whitespace-pre-wrap">
                    {selectedItem.fullText || selectedItem.preview}
                  </p>
                </div>

                {/* Confidence */}
                <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-text-muted">Confidence Score</span>
                    <span className="text-cyber-500 font-medium">
                      {(selectedItem.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyber-500 to-cyber-400 rounded-full"
                      style={{ width: `${selectedItem.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Keywords */}
                {selectedItem.keywords?.length > 0 && (
                  <div className="p-4 rounded-xl bg-dark-500/50 border border-cyber/10">
                    <p className="text-xs text-text-muted mb-2">Keywords ({selectedItem.keywords.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-risk-critical/10 
                                                 text-risk-critical rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-5 border-t border-cyber/10">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl
                             text-risk-critical hover:bg-risk-critical/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl bg-dark-400 text-text-secondary
                               hover:text-white transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleViewFullReport}
                    className="px-4 py-2 rounded-xl bg-cyber-500 text-dark-500 font-medium
                               hover:shadow-glow transition-all duration-300"
                  >
                    View Full Report
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-500/80 backdrop-blur-sm z-50 
                       flex items-center justify-center p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-risk-critical/30 rounded-2xl shadow-2xl 
                         max-w-md w-full p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-risk-critical/10 
                              flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-risk-critical" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Clear All Records?
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                This will permanently delete all {data.length} records from the database. 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-dark-400 text-text-secondary
                             hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-risk-critical text-white font-medium
                             hover:bg-risk-critical/80 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
