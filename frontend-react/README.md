# Dark Web Threat Intelligence Dashboard

A modern, cyber-forensics themed React frontend for the Dark Web Cyber Crime Content Detection Using AI system.

![Dashboard Preview](../docs/dashboard-preview.png)

## ✨ Features

- **Cyber Security Theme** - Teal neon glow effects, dark backgrounds, grid patterns
- **Real-time Threat Analysis** - Analyze text content for cyber crime indicators
- **Interactive Dashboard** - Metrics, charts, and alert monitoring
- **Intelligence Database** - Searchable/filterable table of analyzed content
- **Detailed Reports** - Comprehensive analysis reports with export functionality

## 🛠️ Tech Stack

- **React 18.2** - Modern React with hooks
- **Vite 5.0** - Fast development and build tool
- **TailwindCSS 3.3** - Utility-first CSS framework
- **Recharts 2.10** - React charting library
- **Framer Motion 10.16** - Animation library
- **Lucide React** - Icon library
- **React Router 6.20** - Client-side routing
- **Axios** - HTTP client

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on port 8000
  
  uvicorn api.main:app --reload --port 8000

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📁 Project Structure

```
frontend-react/
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind theme configuration
├── vite.config.js          # Vite configuration with API proxy
├── postcss.config.js       # PostCSS configuration
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Main app with routing
    ├── index.css           # Global styles (cyber theme)
    ├── components/
    │   ├── index.js        # Barrel exports
    │   ├── Sidebar.jsx     # Left navigation
    │   ├── TopHeader.jsx   # Top header with search/notifications
    │   ├── MetricCard.jsx  # Metric display cards
    │   ├── GlowCard.jsx    # Reusable glow card wrapper
    │   ├── RiskBadge.jsx   # Risk level badges
    │   ├── DataTable.jsx   # Sortable data table
    │   ├── ChartPanel.jsx  # Chart wrappers
    │   └── InputAnalyzer.jsx # Text analysis input
    ├── pages/
    │   ├── index.js        # Barrel exports
    │   ├── Dashboard.jsx   # Main dashboard
    │   ├── ThreatAnalyzer.jsx # Content analysis page
    │   ├── Report.jsx      # Analysis report view
    │   └── IntelligenceDB.jsx # Database table view
    └── utils/
        └── api.js          # API service layer
```

## 🎨 Theme Configuration

The cyber-security theme is configured in `tailwind.config.js`:

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Cyber | `#00E5E1` | Primary accent, buttons, highlights |
| Dark 500 | `#0d1117` | Main background |
| Card | `#131c2b` | Card backgrounds |
| Risk Critical | `#ff4b4b` | Critical severity |
| Risk High | `#ff6b35` | High severity |
| Risk Medium | `#ffd93d` | Medium severity |
| Risk Low | `#00d97e` | Low severity / Safe |

### Custom Shadows

- `shadow-glow` - Cyan glow for active elements
- `shadow-glow-lg` - Larger glow for emphasis
- `shadow-critical` - Red glow for critical items
- `shadow-high` - Orange glow for high risk

### Animations

- `glow-pulse` - Pulsing glow effect
- `scan-line` - Scanner line animation
- `fade-in` - Fade in on mount
- `slide-up` - Slide up entrance

## 📡 API Integration

The frontend communicates with the FastAPI backend via Vite's proxy:

```javascript
// Analyze text
const result = await analyzeText('content to analyze', 'bert')

// Check API health
const health = await checkHealth()
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check API status |
| `/api/predict` | POST | Analyze text content |

## 🖼️ Pages

### Dashboard (`/`)
- 4 metric cards (threats detected, scans, high risk, low risk)
- Trend line chart (7-day analysis)
- Category distribution bar chart
- Recent alerts table

### Threat Analyzer (`/analyzer`)
- Source selection (dark web, telegram, forum, paste)
- Text input area with character count
- Model selection (BERT, Baseline)
- Example content buttons
- Real-time results preview

### Report (`/report`)
- Two-column layout
- Risk level badge
- Confidence score with progress bar
- Category probability distribution
- Matched keywords
- Export functionality

### Intelligence Database (`/database`)
- Searchable table
- Category filter
- Severity filter
- Modal for record details
- Statistics footer

## 🔧 Development

### Code Style

- Functional components with hooks
- JSDoc comments for documentation
- Consistent file naming (PascalCase for components)
- Barrel exports for clean imports

### Adding New Components

1. Create component in `src/components/`
2. Export from `src/components/index.js`
3. Import using: `import { ComponentName } from './components'`

### Adding New Pages

1. Create page in `src/pages/`
2. Export from `src/pages/index.js`
3. Add route in `App.jsx`
4. Add navigation link in `Sidebar.jsx`

## 📄 License

This project is part of the Dark Web Cyber Crime Content Detection Using AI research project.

---

Built with ❤️ using React + TailwindCSS
