/**
 * ============================================
 * INPUT ANALYZER COMPONENT
 * Text input with source selection for analysis
 * ============================================
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Send, 
  FileText, 
  Globe, 
  MessageSquare,
  Loader2,
  Sparkles,
  AlertTriangle
} from 'lucide-react'

// Data source options
const dataSources = [
  { id: 'manual', label: 'Manual Input', icon: FileText, description: 'Type or paste content directly' },
  { id: 'dark_web_forum', label: 'Dark Web Forum', icon: Globe, description: 'Content from dark web forums' },
  { id: 'telegram', label: 'Telegram Channel', icon: MessageSquare, description: 'Telegram message content' },
]

// Example content for quick testing
const exampleContent = [
  { 
    label: 'Financial Fraud', 
    text: 'Selling fresh CC dumps track 1&2 with PIN. US bins available. $50 each. Escrow accepted. Contact via Telegram.' 
  },
  { 
    label: 'Fake Documents', 
    text: 'High quality fake passport - passes UV light test. US, UK, EU available. Ships discrete packaging within 5 days.' 
  },
  { 
    label: 'Hacking Services', 
    text: 'DDoS service - take down any website. 500Gbps attack power. $100/hour. Professional service. Telegram contact only.' 
  },
  { 
    label: 'Drug Sales', 
    text: 'Premium MDMA available for bulk orders. 98% purity tested. Ships from Netherlands. Vacuum sealed stealth shipping.' 
  },
  { 
    label: 'Normal Content', 
    text: 'Looking for recommendations on good VPN services for privacy and security while working remotely.' 
  },
]

export default function InputAnalyzer({ onAnalyze, isLoading }) {
  const [selectedSource, setSelectedSource] = useState('manual')
  const [content, setContent] = useState('')
  const [selectedModel, setSelectedModel] = useState('baseline')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (content.trim() && !isLoading) {
      onAnalyze({ text: content, model: selectedModel, source: selectedSource })
    }
  }

  const handleExampleClick = (example) => {
    setContent(example.text)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Source Selection */}
      <div className="glow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Data Source</h3>
          <span className="text-xs text-cyber-500 bg-cyber-500/10 px-2 py-1 rounded-lg">
            Selected: {dataSources.find(s => s.id === selectedSource)?.label}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {dataSources.map((source) => {
            const Icon = source.icon
            const isSelected = selectedSource === source.id
            return (
              <button
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className={`flex flex-col items-start gap-2 p-4 rounded-xl border transition-all duration-300
                           ${isSelected
                             ? 'bg-cyber-500/15 border-cyber-500/50 ring-1 ring-cyber-500/30'
                             : 'bg-card border-cyber/10 hover:border-cyber/30'
                           }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyber-500' : 'text-text-secondary'}`} />
                  <span className={`font-medium text-sm ${isSelected ? 'text-cyber-500' : 'text-text-secondary'}`}>
                    {source.label}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyber-500 animate-pulse" />
                  )}
                </div>
                <p className={`text-xs ${isSelected ? 'text-cyber-500/70' : 'text-text-muted'}`}>
                  {source.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Input */}
      <div className="glow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Content to Analyze</h3>
            <p className="text-sm text-text-muted mt-0.5">
              Source: <span className="text-cyber-500">{dataSources.find(s => s.id === selectedSource)?.label}</span>
            </p>
          </div>
          
          {/* Model Selection */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-card border border-cyber/20 rounded-lg px-3 py-2 text-sm
                       text-white focus:outline-none focus:border-cyber-500"
          >
            <option value="baseline">Baseline Model (Faster)</option>
            <option value="bert">BERT Model (Accurate)</option>
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter or paste the text content you want to analyze for potential cyber threats..."
            className="textarea-cyber h-48 mb-4"
          />

          {/* Character Count */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-text-muted">
              {content.length} / 10,000 characters
            </span>
            {content.length > 0 && (
              <button
                type="button"
                onClick={() => setContent('')}
                className="text-xs text-text-muted hover:text-risk-critical transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={!content.trim() || isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wider
                       flex items-center justify-center gap-3 transition-all duration-300
                       ${content.trim() && !isLoading
                         ? 'bg-gradient-to-r from-cyber-500 to-cyber-600 text-dark-500 shadow-glow hover:shadow-glow-lg glow-pulse'
                         : 'bg-card text-text-muted cursor-not-allowed'
                       }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Content...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run AI Intelligence Analysis
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* Example Content */}
      <div className="glow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-risk-medium" />
          <h3 className="text-sm font-semibold text-white">Quick Test Examples</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {exampleContent.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="px-3 py-1.5 rounded-lg bg-card border border-cyber/10
                         text-xs font-medium text-text-secondary
                         hover:border-cyber/30 hover:text-white transition-all duration-300"
            >
              {example.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-3">
          Click an example to load sample content for testing the analyzer
        </p>
      </div>
    </motion.div>
  )
}
