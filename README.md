# Dark Web Cybercrime Content Detection System

## Overview
AI-powered system to detect and classify cybercrime-related text using BERT-based NLP models.

## Features
- Text preprocessing and cleaning
- TF-IDF + ML baseline models
- DistilBERT deep learning classifier
- 7 crime category classification
- Confidence scoring
- Keyword highlighting
- REST API (FastAPI)
- React Frontend with Auth
- MongoDB for data storage
- User authentication (JWT)

### 🆕 Advanced Intelligence Features

#### 🔴 Autonomous Threat Prioritization & Alert Engine
SOC-style alerting system that prioritizes threats based on:
- **Risk Score** (0-100 scale)
- **Crime Type Severity** (Weapons = 10, Identity Theft = 9, etc.)
- **Vendor Reputation** (tracks repeat offenders)
- **Volume Trends** (increasing, stable, decreasing)

**Output Levels:**
- 🔴 **CRITICAL** - Immediate attention (within 15 mins)
- 🟠 **HIGH** - Priority investigation (within 1 hour)
- 🟡 **WATCHLIST** - Monitor closely (within 24 hours)
- 🟢 **LOW** - Standard processing (within 72 hours)

#### 🌍 Cross-Lingual & Cross-Cultural Crime Intelligence
Detects crime patterns across multiple languages:
- English
- Russian (Cyrillic script)
- Chinese (Simplified)
- Arabic
- Hindi-English slang (Hinglish)

Features:
- Automatic language detection
- Slang normalization (maps dark web slang to standard terms)
- Cultural context awareness
- Cross-lingual keyword matching

#### 📋 AI Investigator Report Generator (Case File Mode)
Generates police-style intelligence reports:
```
INTELLIGENCE REPORT
Case Number: CASE-IDT-20260202-001
Classification: RESTRICTED

EXECUTIVE SUMMARY:
This content has been classified as Identity Theft with 92% confidence.
Key indicators include: fullz, ssn, dob, btc, escrow.

THREAT ASSESSMENT:
HIGH THREAT: This content exhibits strong indicators of illegal activity.

RECOMMENDED ACTIONS:
1. IMMEDIATE: Escalate to senior analyst
2. Check against known data breach indicators
3. Monitor vendor activity
```

## Prerequisites
- **Python 3.11** (IMPORTANT: Python 3.13 has compatibility issues with ML packages)
- **Node.js 18+** (for React frontend)
- **MongoDB** (optional - falls back to JSON storage)

## Installation & Setup

### Step 1: Backend Setup

```bash
# Navigate to project folder
cd "Dark Web Cyber Crime Content Detection Using AI"

# Create virtual environment (use Python 3.11)
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate  # Windows
# OR
source .venv/bin/activate  # Linux/Mac

# Install Python dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

### Step 2: Frontend Setup

```bash
# Navigate to frontend folder
cd frontend-react

# Install Node.js dependencies
npm install

# Go back to project root
cd ..
```

### Step 3: MongoDB Setup (Optional)

The system uses MongoDB for storing users and analysis history. If MongoDB is not available, it automatically falls back to JSON file storage.

```bash
# Option 1: Install MongoDB Community Edition
# Download from: https://www.mongodb.com/try/download/community

# Option 2: Use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Running the Application

**IMPORTANT:** Run both backend AND frontend in separate terminals!

### Terminal 1: Start Backend API
```bash
cd "Dark Web Cyber Crime Content Detection Using AI"
.venv\Scripts\activate
python -m uvicorn api.main:app --reload --port 8000
```
The API runs at: http://localhost:8000

### Terminal 2: Start Frontend
```bash
cd "Dark Web Cyber Crime Content Detection Using AI\frontend-react"
npm run dev
```
The frontend opens at: http://localhost:3000

## First Time Usage

1. Open http://localhost:3000 in your browser
2. Click "Register" to create a new account
3. Login with your credentials
4. Start analyzing dark web content!

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Classify text |
| `/health` | GET | Health check |
| `/metrics` | GET | Model metrics |
| `/categories` | GET | Get crime categories |
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | User login |
| `/auth/me` | GET | Get current user |
| `/auth/profile` | PUT | Update profile |
| `/auth/settings` | PUT | Update settings |
| `/auth/password` | PUT | Change password |
| `/history` | GET | Get analysis history |
| `/history/stats` | GET | Get statistics |
| `/database/status` | GET | Check MongoDB status |

### 🆕 Intelligence Analysis Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze/advanced` | POST | Full intelligence analysis (prioritization + cross-lingual + report) |
| `/analyze/prioritize` | POST | Get SOC-style threat alert with priority levels |
| `/analyze/cross-lingual` | POST | Multilingual content analysis |
| `/analyze/report` | POST | Generate JSON intelligence report |
| `/analyze/report/text` | POST | Generate text-format case file |
| `/alerts/stats` | GET | Get threat prioritization statistics |

## Model Performance

### BERT Classifier (DistilBERT)
- **Test Accuracy:** 100.00%
- **F1 Score:** 1.0000
- **Training Time:** ~5 minutes (Google Colab T4 GPU)
- **Model Size:** ~255 MB
- **Categories:** 7 cybercrime types

### Training Details
- **Dataset:** 2,800 training samples, 350 validation, 350 test
- **Epochs:** 5
- **Batch Size:** 16
- **Learning Rate:** 2e-5
- **Hardware:** Google Colab T4 GPU (15GB VRAM)

## Crime Categories
1. Identity Theft
2. Financial Fraud
3. Drug Sales
4. Weapons Sales
5. Hacking Services
6. Fake Documents
7. Normal/Safe

## Project Structure
```
Dark Web Cyber Crime Content Detection Using AI/
├── api/                    # FastAPI backend
│   ├── main.py             # Main API endpoints
│   ├── auth.py             # Authentication module
│   └── database.py         # MongoDB connection
├── data/                   # Dataset files
│   ├── processed/          # Train/val/test CSV files
│   └── raw/                # Raw data
├── frontend-react/         # React + Vite frontend
│   ├── src/                # React components
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
├── models/                 # Trained model files
│   └── bert/               # DistilBERT model (~255 MB)
├── src/                    # Python source code
│   ├── inference/          # Prediction logic
│   ├── intelligence/       # 🆕 Advanced intelligence modules
│   │   ├── threat_prioritizer.py  # SOC-style threat alerting
│   │   ├── cross_lingual.py       # Multilingual analysis
│   │   └── report_generator.py    # Case file generation
│   ├── models/             # Model definitions
│   ├── preprocessing/      # Text processing
│   └── features/           # Feature extraction
├── tests/                  # Unit tests
├── scripts/                # Training scripts
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## Requirements
- Python 3.11 (NOT 3.13 - has compatibility issues)
- Node.js 18+
- PyTorch 2.0+
- MongoDB (optional)

## Troubleshooting

### "ModuleNotFoundError" or package errors
Make sure you're using Python 3.11, not 3.13. Check with:
```bash
python --version
```

### "Connection refused" error in frontend
Make sure the backend API is running on port 8000.

### Registration/Login not working
Check if both frontend (port 3000) and backend (port 8000) are running.
