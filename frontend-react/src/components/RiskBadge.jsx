/**
 * ============================================
 * RISK BADGE COMPONENT
 * Colored badges for risk/severity levels
 * ============================================
 */

import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, CheckCircle, Shield } from 'lucide-react'

// Risk level configurations
const riskConfigs = {
  critical: {
    bg: 'bg-gradient-to-r from-risk-critical to-red-700',
    text: 'text-white',
    shadow: 'shadow-glow-red',
    icon: AlertTriangle,
    animate: true,
  },
  high: {
    bg: 'bg-gradient-to-r from-risk-high to-orange-700',
    text: 'text-white',
    shadow: 'shadow-[0_0_15px_rgba(255,107,53,0.4)]',
    icon: AlertCircle,
    animate: false,
  },
  medium: {
    bg: 'bg-gradient-to-r from-risk-medium to-yellow-600',
    text: 'text-dark-500',
    shadow: 'shadow-glow-yellow',
    icon: Info,
    animate: false,
  },
  low: {
    bg: 'bg-gradient-to-r from-risk-low to-green-600',
    text: 'text-dark-500',
    shadow: 'shadow-glow-green',
    icon: CheckCircle,
    animate: false,
  },
  safe: {
    bg: 'bg-gradient-to-r from-cyber-500 to-cyber-700',
    text: 'text-dark-500',
    shadow: 'shadow-glow',
    icon: Shield,
    animate: false,
  },
}

export default function RiskBadge({ 
  level = 'safe', 
  size = 'md', 
  showIcon = false,
  className = '' 
}) {
  const config = riskConfigs[level.toLowerCase()] || riskConfigs.safe
  const Icon = config.icon

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
    xl: 'px-6 py-3 text-lg',
  }

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-1.5 font-bold rounded-full uppercase tracking-wider
        ${config.bg} ${config.text} ${config.shadow} ${sizeClasses[size]}
        ${config.animate ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {showIcon && <Icon className="w-4 h-4" />}
      {level}
    </motion.span>
  )
}

/**
 * ============================================
 * CATEGORY BADGE COMPONENT
 * For displaying threat categories
 * ============================================
 */
export function CategoryBadge({ category, className = '' }) {
  // Category color mapping
  const categoryColors = {
    'Identity Theft': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Financial Fraud': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Drug Sales': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Weapons Sales': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Hacking Services': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Fake Documents': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Normal': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  const colors = categoryColors[category] || categoryColors['Normal']

  return (
    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${colors} ${className}`}>
      {category}
    </span>
  )
}

/**
 * ============================================
 * KEYWORD TAG COMPONENT
 * For displaying detected keywords
 * ============================================
 */
export function KeywordTag({ keyword, variant = 'danger' }) {
  const variants = {
    danger: 'bg-risk-critical/10 text-risk-critical border-risk-critical/30',
    warning: 'bg-risk-medium/10 text-risk-medium border-risk-medium/30',
    info: 'bg-cyber-500/10 text-cyber-500 border-cyber-500/30',
  }

  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg border 
                      ${variants[variant]} transition-all duration-300
                      hover:scale-105 cursor-default`}>
      {keyword}
    </span>
  )
}
