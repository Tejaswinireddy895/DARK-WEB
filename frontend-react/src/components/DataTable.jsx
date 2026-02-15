/**
 * ============================================
 * DATA TABLE COMPONENT
 * Styled table with sorting, actions, badges
 * ============================================
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronUp, ChevronDown, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import RiskBadge, { CategoryBadge } from './RiskBadge'

export default function DataTable({ 
  columns, 
  data, 
  onRowClick,
  onViewDetails,
  showActions = true 
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Handle column sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Sort data based on config
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0
    
    const aVal = a[sortConfig.key]
    const bVal = b[sortConfig.key]
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Render cell based on column type
  const renderCell = (row, column) => {
    const value = row[column.key]

    switch (column.type) {
      case 'risk':
        return <RiskBadge level={value} size="sm" />
      
      case 'category':
        return <CategoryBadge category={value} />
      
      case 'date':
        return (
          <span className="text-text-secondary text-sm">
            {new Date(value).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )
      
      case 'preview':
        return (
          <span className="text-text-secondary text-sm font-mono line-clamp-1 max-w-xs">
            {value}
          </span>
        )
      
      case 'id':
        return (
          <span className="text-cyber-500 font-mono text-sm">
            #{value}
          </span>
        )
      
      default:
        return <span className="text-text-secondary">{value}</span>
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-cyber/10">
      <table className="w-full">
        {/* Table Header */}
        <thead>
          <tr className="bg-card">
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => column.sortable && handleSort(column.key)}
                className={`px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider
                           text-cyber-500 border-b border-cyber/10
                           ${column.sortable ? 'cursor-pointer hover:bg-cyber-500/5' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortConfig.key === column.key && (
                    sortConfig.direction === 'asc' 
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
            ))}
            {showActions && (
              <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider
                            text-cyber-500 border-b border-cyber/10">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {sortedData.map((row, index) => (
            <motion.tr
              key={row.id || index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onRowClick?.(row)}
              className="border-b border-cyber/5 hover:bg-cyber-500/5 
                         transition-colors cursor-pointer group"
            >
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-4">
                  {renderCell(row, column)}
                </td>
              ))}
              
              {showActions && (
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 
                                  transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails?.(row)
                      }}
                      className="p-2 rounded-lg bg-cyber-500/10 text-cyber-500 
                                 hover:bg-cyber-500/20 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg bg-card hover:bg-risk-critical/10 
                                 text-text-muted hover:text-risk-critical transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              )}
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-text-muted">No data available</p>
        </div>
      )}
    </div>
  )
}

/**
 * ============================================
 * TABLE PAGINATION COMPONENT
 * ============================================
 */
export function TablePagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  itemsPerPage,
  totalItems 
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-cyber/10">
      <p className="text-sm text-text-muted">
        Showing <span className="text-white font-medium">{startItem}</span> to{' '}
        <span className="text-white font-medium">{endItem}</span> of{' '}
        <span className="text-white font-medium">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg bg-card border border-cyber/10
                     text-sm text-text-secondary hover:text-white hover:border-cyber/30
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                       ${currentPage === i + 1 
                         ? 'bg-cyber-500 text-dark-500' 
                         : 'bg-card text-text-secondary hover:bg-cyber-500/10'}`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg bg-card border border-cyber/10
                     text-sm text-text-secondary hover:text-white hover:border-cyber/30
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  )
}
