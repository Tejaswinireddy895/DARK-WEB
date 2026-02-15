"""
Autonomous Threat Prioritization & Alert Engine

AI-driven alerting system that decides:
- Which content needs immediate attention
- Which can be monitored later

Uses:
- Risk score
- Crime type severity
- Vendor reputation
- Volume trends

Output Levels:
🔴 CRITICAL - Immediate attention required
🟠 HIGH - High risk, prioritize
🟡 WATCHLIST - Monitor closely
🟢 LOW - Low priority

Mimics real SOC / intelligence workflows
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict
import hashlib
import re

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import CRIME_CATEGORIES, RISK_LEVELS, SUSPICIOUS_KEYWORDS


class ThreatLevel(Enum):
    """Threat priority levels with visual indicators."""
    CRITICAL = ("🔴", "CRITICAL", 4, "#ff1744")
    HIGH = ("🟠", "HIGH", 3, "#ff9100")
    WATCHLIST = ("🟡", "WATCHLIST", 2, "#ffea00")
    LOW = ("🟢", "LOW", 1, "#00e676")
    
    def __init__(self, emoji: str, label: str, priority: int, color: str):
        self.emoji = emoji
        self.label = label
        self.priority = priority
        self.color = color


class AlertPriority(Enum):
    """Alert priority for SOC workflow."""
    IMMEDIATE = "IMMEDIATE"  # Requires immediate action
    URGENT = "URGENT"        # Handle within 1 hour
    ELEVATED = "ELEVATED"    # Handle within 24 hours  
    ROUTINE = "ROUTINE"      # Standard processing


@dataclass
class VendorProfile:
    """Vendor reputation tracking."""
    vendor_id: str
    names: List[str] = field(default_factory=list)
    contact_methods: List[str] = field(default_factory=list)
    first_seen: datetime = field(default_factory=datetime.utcnow)
    last_seen: datetime = field(default_factory=datetime.utcnow)
    total_posts: int = 0
    threat_score: float = 0.0
    categories_seen: Dict[str, int] = field(default_factory=dict)
    reputation_level: str = "UNKNOWN"


@dataclass
class ThreatAlert:
    """Complete threat alert with prioritization."""
    alert_id: str
    text: str
    category: str
    confidence: float
    threat_level: ThreatLevel
    alert_priority: AlertPriority
    risk_score: float
    urgency_score: float
    
    # Analysis details
    keywords: List[str]
    indicators: List[str]
    vendor_info: Optional[VendorProfile]
    
    # Temporal analysis
    timestamp: datetime
    volume_trend: str  # "INCREASING", "STABLE", "DECREASING"
    similar_count_24h: int
    
    # Recommended actions
    recommended_actions: List[str]
    suggested_response_time: str
    
    # Scores breakdown
    score_breakdown: Dict[str, float]


class ThreatPrioritizer:
    """
    Autonomous Threat Prioritization Engine
    
    Evaluates threats based on multiple factors:
    1. Crime type severity
    2. Confidence score
    3. Keyword density
    4. Vendor reputation
    5. Volume trends
    6. Temporal patterns
    """
    
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
    
    # High-value indicators for immediate attention
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
        "ddos": 1.5
    }
    
    # Contact method patterns
    CONTACT_PATTERNS = {
        "telegram": r'@[\w]+|t\.me/[\w]+',
        "wickr": r'wickr[:\s]+[\w]+',
        "session": r'session[:\s]+[\w]+',
        "jabber": r'[\w]+@[\w]+\.[\w]+',
        "email": r'[\w\.-]+@[\w\.-]+\.\w+',
        "onion": r'[\w]+\.onion'
    }
    
    def __init__(self):
        """Initialize the threat prioritizer."""
        self.vendor_profiles: Dict[str, VendorProfile] = {}
        self.recent_alerts: List[ThreatAlert] = []
        self.category_volume: Dict[str, List[datetime]] = defaultdict(list)
        self.alert_counter = 0
        
    def _generate_alert_id(self) -> str:
        """Generate unique alert ID."""
        self.alert_counter += 1
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"ALERT-{timestamp}-{self.alert_counter:04d}"
    
    def _calculate_keyword_density(self, text: str, category: str) -> Tuple[float, List[str]]:
        """Calculate keyword density and extract found keywords."""
        text_lower = text.lower()
        words = text_lower.split()
        total_words = len(words) if words else 1
        
        found_keywords = []
        
        # Check category-specific keywords
        if category in SUSPICIOUS_KEYWORDS:
            for kw in SUSPICIOUS_KEYWORDS[category]:
                if kw.lower() in text_lower:
                    found_keywords.append(kw)
        
        # Check all categories
        for cat, keywords in SUSPICIOUS_KEYWORDS.items():
            if cat != category:
                for kw in keywords:
                    if kw.lower() in text_lower and kw not in found_keywords:
                        found_keywords.append(kw)
        
        density = len(found_keywords) / total_words
        return min(density * 10, 1.0), found_keywords
    
    def _extract_high_value_indicators(self, text: str) -> Tuple[float, List[str]]:
        """Extract high-value threat indicators."""
        text_lower = text.lower()
        indicators = []
        multiplier = 1.0
        
        for indicator, weight in self.HIGH_VALUE_INDICATORS.items():
            if indicator in text_lower:
                indicators.append(indicator)
                multiplier *= weight
        
        return min(multiplier, 3.0), indicators
    
    def _extract_vendor_info(self, text: str) -> Optional[VendorProfile]:
        """Extract and track vendor information."""
        text_lower = text.lower()
        contacts = []
        
        for contact_type, pattern in self.CONTACT_PATTERNS.items():
            matches = re.findall(pattern, text_lower)
            for match in matches:
                contacts.append(f"{contact_type}:{match}")
        
        if not contacts:
            return None
        
        # Create vendor ID from contacts
        vendor_id = hashlib.md5("".join(sorted(contacts)).encode()).hexdigest()[:12]
        
        if vendor_id in self.vendor_profiles:
            profile = self.vendor_profiles[vendor_id]
            profile.last_seen = datetime.utcnow()
            profile.total_posts += 1
        else:
            profile = VendorProfile(
                vendor_id=vendor_id,
                contact_methods=contacts
            )
            self.vendor_profiles[vendor_id] = profile
        
        # Update reputation based on activity
        if profile.total_posts > 10:
            profile.reputation_level = "ESTABLISHED"
        elif profile.total_posts > 3:
            profile.reputation_level = "ACTIVE"
        else:
            profile.reputation_level = "NEW"
        
        return profile
    
    def _analyze_volume_trend(self, category: str) -> Tuple[str, int]:
        """Analyze volume trend for category."""
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        last_48h = now - timedelta(hours=48)
        
        # Clean old entries
        self.category_volume[category] = [
            ts for ts in self.category_volume[category]
            if ts > last_48h
        ]
        
        # Count recent
        recent_24h = sum(1 for ts in self.category_volume[category] if ts > last_24h)
        previous_24h = sum(1 for ts in self.category_volume[category] 
                          if last_48h < ts <= last_24h)
        
        # Add current
        self.category_volume[category].append(now)
        
        if recent_24h > previous_24h * 1.5:
            trend = "INCREASING"
        elif recent_24h < previous_24h * 0.5:
            trend = "DECREASING"
        else:
            trend = "STABLE"
        
        return trend, recent_24h
    
    def _calculate_urgency_score(
        self,
        category: str,
        confidence: float,
        keyword_density: float,
        indicator_multiplier: float,
        vendor: Optional[VendorProfile],
        volume_trend: str
    ) -> Tuple[float, Dict[str, float]]:
        """Calculate overall urgency score."""
        breakdown = {}
        
        # Base score from category severity (0-40 points)
        category_score = (self.CATEGORY_SEVERITY.get(category, 5) / 10) * 40
        breakdown["category_severity"] = category_score
        
        # Confidence score (0-20 points)
        confidence_score = confidence * 20
        breakdown["confidence"] = confidence_score
        
        # Keyword density (0-15 points)
        density_score = keyword_density * 15
        breakdown["keyword_density"] = density_score
        
        # Indicator multiplier (0-15 points)
        indicator_score = min((indicator_multiplier - 1) * 10, 15)
        breakdown["high_value_indicators"] = indicator_score
        
        # Vendor reputation (0-5 points)
        vendor_score = 0
        if vendor:
            if vendor.reputation_level == "ESTABLISHED":
                vendor_score = 5
            elif vendor.reputation_level == "ACTIVE":
                vendor_score = 3
            else:
                vendor_score = 1
        breakdown["vendor_reputation"] = vendor_score
        
        # Volume trend (0-5 points)
        trend_scores = {"INCREASING": 5, "STABLE": 2, "DECREASING": 0}
        trend_score = trend_scores.get(volume_trend, 2)
        breakdown["volume_trend"] = trend_score
        
        total_score = sum(breakdown.values())
        return min(total_score, 100), breakdown
    
    def _determine_threat_level(self, urgency_score: float, category: str) -> ThreatLevel:
        """Determine threat level from urgency score."""
        # Critical categories get elevated
        if category == "Weapons Sales" and urgency_score >= 50:
            return ThreatLevel.CRITICAL
        
        if urgency_score >= 75:
            return ThreatLevel.CRITICAL
        elif urgency_score >= 50:
            return ThreatLevel.HIGH
        elif urgency_score >= 25:
            return ThreatLevel.WATCHLIST
        else:
            return ThreatLevel.LOW
    
    def _determine_alert_priority(
        self, 
        threat_level: ThreatLevel,
        volume_trend: str,
        vendor: Optional[VendorProfile]
    ) -> AlertPriority:
        """Determine SOC alert priority."""
        if threat_level == ThreatLevel.CRITICAL:
            return AlertPriority.IMMEDIATE
        
        if threat_level == ThreatLevel.HIGH:
            if volume_trend == "INCREASING":
                return AlertPriority.IMMEDIATE
            return AlertPriority.URGENT
        
        if threat_level == ThreatLevel.WATCHLIST:
            if vendor and vendor.reputation_level == "ESTABLISHED":
                return AlertPriority.URGENT
            return AlertPriority.ELEVATED
        
        return AlertPriority.ROUTINE
    
    def _generate_recommended_actions(
        self,
        category: str,
        threat_level: ThreatLevel,
        vendor: Optional[VendorProfile],
        indicators: List[str]
    ) -> List[str]:
        """Generate recommended actions based on threat analysis."""
        actions = []
        
        # Category-specific actions
        category_actions = {
            "Weapons Sales": [
                "Escalate to law enforcement liaison",
                "Flag for priority investigation",
                "Cross-reference with known arms trafficking networks"
            ],
            "Identity Theft": [
                "Check against known data breach indicators",
                "Monitor for related financial fraud activity",
                "Flag for identity theft task force"
            ],
            "Hacking Services": [
                "Assess potential targets in critical infrastructure",
                "Check for 0-day vulnerability claims",
                "Monitor for proof-of-concept leaks"
            ],
            "Financial Fraud": [
                "Cross-reference with banking fraud indicators",
                "Check for money laundering patterns",
                "Flag for financial crimes unit"
            ],
            "Drug Sales": [
                "Check for fentanyl indicators (critical)",
                "Monitor shipping patterns",
                "Cross-reference vendor history"
            ],
            "Fake Documents": [
                "Assess document types and jurisdictions",
                "Monitor for identity fraud patterns"
            ]
        }
        
        if category in category_actions:
            actions.extend(category_actions[category][:2])
        
        # Threat level actions
        if threat_level == ThreatLevel.CRITICAL:
            actions.insert(0, "IMMEDIATE: Initiate real-time monitoring")
            actions.append("Generate incident report within 30 minutes")
        elif threat_level == ThreatLevel.HIGH:
            actions.append("Schedule priority review within 1 hour")
        
        # Vendor-specific actions
        if vendor:
            if vendor.reputation_level == "ESTABLISHED":
                actions.append(f"High-priority vendor tracking: {vendor.vendor_id}")
            actions.append(f"Update vendor profile with new activity")
        
        # Indicator-specific actions
        if "0day" in indicators or "zero-day" in indicators:
            actions.insert(0, "CRITICAL: Potential zero-day threat - immediate analysis required")
        if "fentanyl" in indicators:
            actions.insert(0, "PRIORITY: Fentanyl indicator detected - escalate immediately")
        if "ransomware" in indicators:
            actions.append("Check against known ransomware groups")
        
        return actions[:6]  # Limit to 6 actions
    
    def _get_response_time(self, priority: AlertPriority) -> str:
        """Get suggested response time."""
        response_times = {
            AlertPriority.IMMEDIATE: "Within 15 minutes",
            AlertPriority.URGENT: "Within 1 hour",
            AlertPriority.ELEVATED: "Within 24 hours",
            AlertPriority.ROUTINE: "Within 72 hours"
        }
        return response_times.get(priority, "Within 72 hours")
    
    def prioritize(
        self,
        text: str,
        category: str,
        confidence: float,
        keywords: List[str] = None
    ) -> ThreatAlert:
        """
        Main prioritization method.
        
        Analyzes content and returns complete threat assessment.
        
        Args:
            text: Content to analyze
            category: Predicted crime category
            confidence: Model confidence score
            keywords: Pre-extracted keywords (optional)
            
        Returns:
            ThreatAlert with full prioritization
        """
        # Calculate keyword density
        keyword_density, found_keywords = self._calculate_keyword_density(text, category)
        if keywords:
            found_keywords = list(set(found_keywords + keywords))
        
        # Extract high-value indicators
        indicator_multiplier, indicators = self._extract_high_value_indicators(text)
        
        # Extract vendor info
        vendor = self._extract_vendor_info(text)
        
        # Analyze volume trend
        volume_trend, similar_count = self._analyze_volume_trend(category)
        
        # Calculate urgency score
        urgency_score, score_breakdown = self._calculate_urgency_score(
            category=category,
            confidence=confidence,
            keyword_density=keyword_density,
            indicator_multiplier=indicator_multiplier,
            vendor=vendor,
            volume_trend=volume_trend
        )
        
        # Determine threat level and priority
        threat_level = self._determine_threat_level(urgency_score, category)
        alert_priority = self._determine_alert_priority(threat_level, volume_trend, vendor)
        
        # Generate recommended actions
        recommended_actions = self._generate_recommended_actions(
            category, threat_level, vendor, indicators
        )
        
        # Create alert
        alert = ThreatAlert(
            alert_id=self._generate_alert_id(),
            text=text[:500] if len(text) > 500 else text,
            category=category,
            confidence=confidence,
            threat_level=threat_level,
            alert_priority=alert_priority,
            risk_score=urgency_score,
            urgency_score=urgency_score,
            keywords=found_keywords,
            indicators=indicators,
            vendor_info=vendor,
            timestamp=datetime.utcnow(),
            volume_trend=volume_trend,
            similar_count_24h=similar_count,
            recommended_actions=recommended_actions,
            suggested_response_time=self._get_response_time(alert_priority),
            score_breakdown=score_breakdown
        )
        
        # Store for trend analysis
        self.recent_alerts.append(alert)
        if len(self.recent_alerts) > 1000:
            self.recent_alerts = self.recent_alerts[-500:]
        
        return alert
    
    def get_alert_summary(self, alert: ThreatAlert) -> Dict:
        """Get JSON-serializable alert summary."""
        return {
            "alert_id": alert.alert_id,
            "threat_level": {
                "level": alert.threat_level.label,
                "emoji": alert.threat_level.emoji,
                "color": alert.threat_level.color,
                "priority": alert.threat_level.priority
            },
            "alert_priority": alert.alert_priority.value,
            "category": alert.category,
            "confidence": alert.confidence,
            "risk_score": round(alert.risk_score, 2),
            "keywords": alert.keywords,
            "indicators": alert.indicators,
            "vendor_id": alert.vendor_info.vendor_id if alert.vendor_info else None,
            "vendor_reputation": alert.vendor_info.reputation_level if alert.vendor_info else None,
            "volume_trend": alert.volume_trend,
            "similar_count_24h": alert.similar_count_24h,
            "recommended_actions": alert.recommended_actions,
            "suggested_response_time": alert.suggested_response_time,
            "score_breakdown": alert.score_breakdown,
            "timestamp": alert.timestamp.isoformat()
        }
    
    def get_dashboard_stats(self) -> Dict:
        """Get statistics for dashboard display."""
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        
        recent = [a for a in self.recent_alerts if a.timestamp > last_24h]
        
        stats = {
            "total_alerts_24h": len(recent),
            "by_threat_level": {
                "critical": sum(1 for a in recent if a.threat_level == ThreatLevel.CRITICAL),
                "high": sum(1 for a in recent if a.threat_level == ThreatLevel.HIGH),
                "watchlist": sum(1 for a in recent if a.threat_level == ThreatLevel.WATCHLIST),
                "low": sum(1 for a in recent if a.threat_level == ThreatLevel.LOW)
            },
            "by_priority": {
                "immediate": sum(1 for a in recent if a.alert_priority == AlertPriority.IMMEDIATE),
                "urgent": sum(1 for a in recent if a.alert_priority == AlertPriority.URGENT),
                "elevated": sum(1 for a in recent if a.alert_priority == AlertPriority.ELEVATED),
                "routine": sum(1 for a in recent if a.alert_priority == AlertPriority.ROUTINE)
            },
            "active_vendors": len(self.vendor_profiles),
            "average_risk_score": sum(a.risk_score for a in recent) / len(recent) if recent else 0
        }
        
        return stats


# Singleton instance
_prioritizer = None

def get_prioritizer() -> ThreatPrioritizer:
    """Get or create singleton prioritizer instance."""
    global _prioritizer
    if _prioritizer is None:
        _prioritizer = ThreatPrioritizer()
    return _prioritizer


if __name__ == "__main__":
    # Test the prioritizer
    prioritizer = ThreatPrioritizer()
    
    test_text = """
    Fresh fullz available! SSN + DOB + MMN 
    Verified seller, 500+ sales. 
    Telegram: @darkvendor
    BTC only, escrow accepted.
    Bulk discounts available.
    """
    
    alert = prioritizer.prioritize(
        text=test_text,
        category="Identity Theft",
        confidence=0.92
    )
    
    print("\n=== Threat Alert ===")
    print(f"Alert ID: {alert.alert_id}")
    print(f"Threat Level: {alert.threat_level.emoji} {alert.threat_level.label}")
    print(f"Priority: {alert.alert_priority.value}")
    print(f"Risk Score: {alert.risk_score:.1f}/100")
    print(f"Keywords: {alert.keywords}")
    print(f"Indicators: {alert.indicators}")
    print(f"\nRecommended Actions:")
    for action in alert.recommended_actions:
        print(f"  • {action}")
    print(f"\nResponse Time: {alert.suggested_response_time}")
