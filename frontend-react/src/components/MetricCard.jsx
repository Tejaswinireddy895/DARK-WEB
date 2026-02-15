/**
 * ============================================
 * METRIC CARD COMPONENT
 * Display key metrics with icon, value, label
 * ============================================
 */

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  changeType = 'increase',
  color = 'cyber',
  delay = 0 
}) {
  // Color variants for different metric types
  const colorVariants = {
    cyber: {
      iconBg: 'from-cyber-500 to-cyber-700',
      glow: 'shadow-glow',
      text: 'text-cyber-500',
      border: 'border-cyber-500/20 hover:border-cyber-500/50',
    },
    red: {
      iconBg: 'from-risk-critical to-red-700',
      glow: 'shadow-glow-red',
      text: 'text-risk-critical',
      border: 'border-risk-critical/20 hover:border-risk-critical/50',
    },
    yellow: {
      iconBg: 'from-risk-medium to-yellow-600',
      glow: 'shadow-glow-yellow',
      text: 'text-risk-medium',
      border: 'border-risk-medium/20 hover:border-risk-medium/50',
    },
    green: {
      iconBg: 'from-risk-low to-green-600',
      glow: 'shadow-glow-green',
      text: 'text-risk-low',
      border: 'border-risk-low/20 hover:border-risk-low/50',
    },
  }

  const colors = colorVariants[color] || colorVariants.cyber

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card-light
                  border ${colors.border} p-6 transition-all duration-300
                  hover:shadow-card-hover group`}
    >
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colors.iconBg} opacity-80`} />
      
      {/* Scan Line Effect on Hover */}
      <div className="absolute top-0 left-[-100%] w-full h-0.5 bg-gradient-to-r from-transparent via-cyber-500 to-transparent 
                      group-hover:animate-[scan-line_2s_ease-in-out]" />

      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.iconBg} 
                         flex items-center justify-center ${colors.glow}`}>
          <Icon className="w-6 h-6 text-dark-500" />
        </div>

        {/* Change Indicator */}
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                          ${changeType === 'increase' 
                            ? 'bg-risk-low/10 text-risk-low' 
                            : 'bg-risk-critical/10 text-risk-critical'}`}>
            {changeType === 'increase' 
              ? <TrendingUp className="w-3 h-3" /> 
              : <TrendingDown className="w-3 h-3" />
            }
            {change}
          </div>
        )}
      </div>

      {/* Value & Label */}
      <div className="mt-4">
        <h3 className={`text-3xl font-bold ${colors.text}`}>
          {value}
        </h3>
        <p className="text-text-secondary text-sm mt-1 font-medium">
          {label}
        </p>
      </div>

      {/* Background Decoration */}
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full 
                       bg-gradient-to-br ${colors.iconBg} opacity-5 blur-2xl`} />
    </motion.div>
  )
}
