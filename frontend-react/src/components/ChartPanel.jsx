/**
 * ============================================
 * CHART PANEL COMPONENT
 * Wrapper for Recharts with cyber styling
 * ============================================
 */

import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-dark-500/95 backdrop-blur-sm border border-cyber/20 rounded-lg p-3 shadow-lg">
      <p className="text-text-muted text-xs mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: <span className="text-white">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

// Cyber theme colors
const CYBER_COLORS = {
  primary: '#00E5E1',
  secondary: '#00b8b5',
  tertiary: '#4dfffb',
  grid: 'rgba(0, 229, 225, 0.1)',
  text: '#b3b3b3',
}

const CATEGORY_COLORS = [
  '#00E5E1', // Cyber
  '#ff4b4b', // Red
  '#ffd93d', // Yellow
  '#00d97e', // Green
  '#ff6b35', // Orange
  '#a855f7', // Purple
  '#6c757d', // Gray
]

/**
 * LINE CHART PANEL
 */
export function LineChartPanel({ 
  data, 
  title, 
  subtitle,
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300 
}) {
  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CYBER_COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CYBER_COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={CYBER_COLORS.grid} 
            vertical={false}
          />
          <XAxis 
            dataKey={xAxisKey} 
            stroke={CYBER_COLORS.text}
            tick={{ fill: CYBER_COLORS.text, fontSize: 12 }}
            axisLine={{ stroke: CYBER_COLORS.grid }}
          />
          <YAxis 
            stroke={CYBER_COLORS.text}
            tick={{ fill: CYBER_COLORS.text, fontSize: 12 }}
            axisLine={{ stroke: CYBER_COLORS.grid }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={CYBER_COLORS.primary}
            strokeWidth={2}
            fill="url(#colorValue)"
            dot={{ fill: CYBER_COLORS.primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: CYBER_COLORS.primary, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

/**
 * BAR CHART PANEL
 */
export function BarChartPanel({ 
  data, 
  title, 
  subtitle,
  dataKey = 'value',
  xAxisKey = 'name',
  height = 300,
  horizontal = false 
}) {
  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data} 
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 20, left: horizontal ? 80 : 0, bottom: 5 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={CYBER_COLORS.grid}
            horizontal={!horizontal}
            vertical={horizontal}
          />
          {horizontal ? (
            <>
              <XAxis type="number" stroke={CYBER_COLORS.text} tick={{ fill: CYBER_COLORS.text, fontSize: 12 }} />
              <YAxis type="category" dataKey={xAxisKey} stroke={CYBER_COLORS.text} tick={{ fill: CYBER_COLORS.text, fontSize: 11 }} width={75} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} stroke={CYBER_COLORS.text} tick={{ fill: CYBER_COLORS.text, fontSize: 12 }} />
              <YAxis stroke={CYBER_COLORS.text} tick={{ fill: CYBER_COLORS.text, fontSize: 12 }} />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey={dataKey} 
            fill={CYBER_COLORS.primary}
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

/**
 * PIE/DONUT CHART PANEL
 */
export function PieChartPanel({ 
  data, 
  title, 
  subtitle,
  dataKey = 'value',
  nameKey = 'name',
  height = 300,
  innerRadius = 60,
  outerRadius = 100 
}) {
  return (
    <ChartWrapper title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  )
}

/**
 * CHART WRAPPER COMPONENT
 */
function ChartWrapper({ title, subtitle, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-cyber/10 p-5"
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  )
}

export default ChartWrapper
