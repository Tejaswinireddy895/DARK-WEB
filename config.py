"""
Configuration settings for Dark Web Cybercrime Detection System
"""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
LOGS_DIR = BASE_DIR / "logs"

# Ensure directories exist
LOGS_DIR.mkdir(exist_ok=True)

# Crime categories
CRIME_CATEGORIES = [
    "Identity Theft",
    "Financial Fraud",
    "Drug Sales",
    "Weapons Sales",
    "Hacking Services",
    "Fake Documents",
    "Normal"
]

CATEGORY_TO_ID = {cat: idx for idx, cat in enumerate(CRIME_CATEGORIES)}
ID_TO_CATEGORY = {idx: cat for idx, cat in enumerate(CRIME_CATEGORIES)}

# Risk levels based on category
RISK_LEVELS = {
    "Identity Theft": "HIGH",
    "Financial Fraud": "HIGH",
    "Drug Sales": "HIGH",
    "Weapons Sales": "CRITICAL",
    "Hacking Services": "HIGH",
    "Fake Documents": "MEDIUM",
    "Normal": "SAFE"
}

# Model settings
MODEL_CONFIG = {
    "bert_model_name": "distilbert-base-uncased",
    "max_length": 256,
    "batch_size": 16,
    "learning_rate": 2e-5,
    "epochs": 5,
    "dropout": 0.3,
    "early_stopping_patience": 2
}

# TF-IDF settings
TFIDF_CONFIG = {
    "max_features": 5000,
    "ngram_range": (1, 2),
    "min_df": 2
}

# API settings
API_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "debug": True
}

# Suspicious keywords for highlighting
SUSPICIOUS_KEYWORDS = {
    "Identity Theft": [
        "fullz", "ssn", "dob", "dox", "doxxing", "identity", "personal info",
        "credit report", "bank account", "social security", "drivers license"
    ],
    "Financial Fraud": [
        "cc", "cvv", "dumps", "carding", "bank drops", "cashout", "wire transfer",
        "paypal", "bitcoin", "btc", "escrow", "fresh", "valid", "balance"
    ],
    "Drug Sales": [
        "mdma", "cocaine", "heroin", "fentanyl", "pills", "bulk", "grams",
        "ounce", "shipping", "stealth", "vendor", "domestic", "international"
    ],
    "Weapons Sales": [
        "firearm", "gun", "pistol", "rifle", "ammo", "ammunition", "untraceable",
        "ghost gun", "silencer", "suppressor", "automatic", "semi-auto"
    ],
    "Hacking Services": [
        "ddos", "botnet", "rat", "exploit", "0day", "zero-day", "ransomware",
        "malware", "phishing", "cracking", "bruteforce", "root", "shell"
    ],
    "Fake Documents": [
        "passport", "license", "id card", "diploma", "certificate", "forgery",
        "fake", "counterfeit", "replica", "scan", "template", "hologram"
    ]
}

# Logging settings
LOGGING_CONFIG = {
    "level": "INFO",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "log_file": LOGS_DIR / "predictions.log"
}

# ============================================================================
# Intelligence Analysis Settings
# ============================================================================

# Threat Prioritization Settings
THREAT_PRIORITIZATION_CONFIG = {
    "critical_threshold": 75,
    "high_threshold": 50,
    "watchlist_threshold": 25,
    "volume_trend_window_hours": 24,
    "max_recent_alerts": 1000
}

# Category severity weights (1-10 scale)
CATEGORY_SEVERITY = {
    "Weapons Sales": 10,
    "Identity Theft": 9,
    "Hacking Services": 8,
    "Financial Fraud": 8,
    "Drug Sales": 7,
    "Fake Documents": 6,
    "Normal": 1
}

# High-value threat indicators with multipliers
HIGH_VALUE_INDICATORS = {
    "bulk": 1.5,
    "wholesale": 1.5,
    "escrow": 1.3,
    "verified": 1.2,
    "fresh": 1.4,
    "valid": 1.3,
    "automatic": 1.5,
    "fentanyl": 2.0,
    "ransomware": 1.8,
    "0day": 2.0,
    "zero-day": 2.0,
    "fullz": 1.6,
    "botnet": 1.7,
    "ddos": 1.5,
    "ghost gun": 2.0,
    "untraceable": 1.8
}

# Cross-Lingual Settings
CROSS_LINGUAL_CONFIG = {
    "supported_languages": ["en", "ru", "zh", "ar", "hi", "hi-en"],
    "language_detection_threshold": 0.3,
    "enable_slang_normalization": True,
    "enable_cultural_context": True
}

# Report Generator Settings
REPORT_GENERATOR_CONFIG = {
    "default_classification": "RESTRICTED",
    "max_evidence_items": 10,
    "content_preview_length": 200,
    "enable_case_numbering": True
}

# Alert Priority Response Times
ALERT_RESPONSE_TIMES = {
    "IMMEDIATE": "Within 15 minutes",
    "URGENT": "Within 1 hour",
    "ELEVATED": "Within 24 hours",
    "ROUTINE": "Within 72 hours"
}

# Threat Level Colors for UI
THREAT_LEVEL_COLORS = {
    "CRITICAL": "#ff1744",
    "HIGH": "#ff9100",
    "WATCHLIST": "#ffea00",
    "LOW": "#00e676"
}

# Threat Level Emojis
THREAT_LEVEL_EMOJIS = {
    "CRITICAL": "🔴",
    "HIGH": "🟠",
    "WATCHLIST": "🟡",
    "LOW": "🟢"
}

