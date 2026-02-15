/**
 * ============================================
 * GLOW CARD COMPONENT
 * Reusable card with neon glow border effect
 * ============================================
 */

import { motion } from 'framer-motion'

export default function GlowCard({ 
  children, 
  className = '', 
  title,
  subtitle,
  headerAction,
  noPadding = false,
  delay = 0 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`glow-card ${className}`}
    >
      {/* Card Header */}
      {(title || headerAction) && (
        <div className="flex items-center justify-between p-5 border-b border-cyber/10">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </motion.div>
  )
}

/**
 * ============================================
 * GLASS CARD VARIANT
 * Glassmorphism style card
 * ============================================
 */
export function GlassCard({ children, className = '' }) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  )
}

/**
 * ============================================
 * STAT CARD VARIANT
 * Compact card for inline statistics
 * ============================================
 */
export function StatCard({ label, value, icon: Icon, color = 'cyber' }) {
  const colorClasses = {
    cyber: 'text-cyber-500 bg-cyber-500/10',
    red: 'text-risk-critical bg-risk-critical/10',
    yellow: 'text-risk-medium bg-risk-medium/10',
    green: 'text-risk-low bg-risk-low/10',
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-cyber/10">
      {Icon && (
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} 
                         flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <p className={`text-xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  )
}
