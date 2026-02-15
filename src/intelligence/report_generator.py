"""
AI Investigator Report Generator (Case File Mode)

Automatically generates police-style intelligence reports.

Features:
- Structured case file format
- Key indicator extraction
- Risk assessment
- Suggested actions
- Evidence summary
- Analyst recommendations

Converts AI output into human decision support
for real-world usability.
"""

import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import hashlib
import json
import re

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from config import CRIME_CATEGORIES, SUSPICIOUS_KEYWORDS


class ReportClassification(Enum):
    """Report classification levels."""
    UNCLASSIFIED = "UNCLASSIFIED"
    RESTRICTED = "RESTRICTED"
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"


class ReportStatus(Enum):
    """Report status."""
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    REVIEWED = "REVIEWED"
    ACTIONABLE = "ACTIONABLE"
    CLOSED = "CLOSED"


@dataclass
class EvidenceItem:
    """Individual piece of evidence."""
    evidence_id: str
    evidence_type: str  # "keyword", "pattern", "indicator", "contact"
    value: str
    context: str
    relevance: str  # "HIGH", "MEDIUM", "LOW"
    category_link: str


@dataclass
class IntelligenceReport:
    """Complete intelligence report structure."""
    # Report metadata
    report_id: str
    case_number: str
    report_date: datetime
    classification: ReportClassification
    status: ReportStatus
    analyst_id: str
    
    # Executive summary
    executive_summary: str
    threat_assessment: str
    
    # Content analysis
    original_content: str
    content_hash: str
    content_source: str
    
    # Classification results
    primary_category: str
    category_confidence: float
    secondary_categories: List[str]
    risk_level: str
    
    # Evidence
    key_indicators: List[EvidenceItem]
    supporting_evidence: List[EvidenceItem]
    
    # Intelligence assessment
    likely_activity: str
    modus_operandi: str
    actor_profile: str
    geographic_indicators: List[str]
    
    # Recommendations
    suggested_actions: List[str]
    priority_level: str
    response_timeline: str
    
    # Cross-references
    related_cases: List[str]
    external_references: List[str]
    
    # Technical details
    processing_metadata: Dict[str, Any]


class InvestigatorReportGenerator:
    """
    AI-powered intelligence report generator.
    
    Creates police-style case files from AI analysis results,
    providing actionable intelligence for human analysts.
    """
    
    # Activity descriptions by category
    ACTIVITY_DESCRIPTIONS = {
        "Identity Theft": {
            "likely_activity": "Sale or distribution of stolen personal identification information",
            "modus_operandi": "Actor appears to be offering stolen personal data packages ('fullz') "
                             "which typically include SSN, DOB, name, and financial information. "
                             "Data likely obtained through phishing, data breaches, or insider access.",
            "actor_profile": "Likely a data broker or identity theft network member with access to "
                            "compromised personal databases."
        },
        "Financial Fraud": {
            "likely_activity": "Credit card fraud, payment card data trafficking, or financial scams",
            "modus_operandi": "Actor advertises compromised financial instruments including credit card "
                             "data (dumps/CVV), bank account access, or cashout services. "
                             "May involve carding operations or money laundering.",
            "actor_profile": "Likely associated with organized financial crime network. "
                            "May have technical capabilities for card skimming or database access."
        },
        "Drug Sales": {
            "likely_activity": "Illicit narcotics trafficking through dark web marketplace",
            "modus_operandi": "Vendor offers controlled substances with shipping options. "
                             "Likely uses stealth packaging and cryptocurrency payments. "
                             "May operate through established market or direct deals.",
            "actor_profile": "Dark web drug vendor with established distribution network. "
                            "May have connections to physical supply chains."
        },
        "Weapons Sales": {
            "likely_activity": "Illegal firearms or weapons trafficking",
            "modus_operandi": "Actor offers weapons for sale outside legal channels. "
                             "May include untraceable firearms ('ghost guns'), ammunition, "
                             "or weapon modification services.",
            "actor_profile": "HIGH PRIORITY: Weapons trafficker with access to illegal arms. "
                            "Requires immediate law enforcement coordination."
        },
        "Hacking Services": {
            "likely_activity": "Cybercrime-as-a-service offerings",
            "modus_operandi": "Actor provides hacking tools, malware, or attack services. "
                             "May include DDoS services, RATs, exploit kits, or data breach services.",
            "actor_profile": "Technical threat actor with offensive cyber capabilities. "
                            "May be part of hacking group or independent operator."
        },
        "Fake Documents": {
            "likely_activity": "Fraudulent document production and distribution",
            "modus_operandi": "Actor creates or distributes counterfeit identity documents "
                             "including passports, IDs, diplomas, or certificates. "
                             "May offer template customization services.",
            "actor_profile": "Document forger with technical capabilities for producing "
                            "convincing fraudulent documents."
        },
        "Normal": {
            "likely_activity": "No clearly identified criminal activity",
            "modus_operandi": "Content does not exhibit strong indicators of illegal activity. "
                             "May warrant continued monitoring if context suggests otherwise.",
            "actor_profile": "Unidentified - no clear criminal profile established."
        }
    }
    
    # Geographic indicators
    GEOGRAPHIC_PATTERNS = {
        "US": [r'\$', r'USA', r'domestic US', r'states', r'USPS'],
        "EU": [r'€', r'EUR', r'Europe', r'EU shipping', r'UK'],
        "Russia/CIS": [r'RU', r'Russia', r'₽', r'СНГ', r'Ukraine'],
        "China": [r'CN', r'China', r'¥', r'CNY', r'Alipay'],
        "Global": [r'worldwide', r'international', r'WW ship']
    }
    
    def __init__(self, analyst_id: str = "AI-SYSTEM"):
        """Initialize the report generator."""
        self.analyst_id = analyst_id
        self.report_counter = 0
        
    def _generate_report_id(self) -> str:
        """Generate unique report ID."""
        self.report_counter += 1
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"IR-{timestamp}-{self.report_counter:04d}"
    
    def _generate_case_number(self, category: str) -> str:
        """Generate case number based on category."""
        category_codes = {
            "Identity Theft": "IDT",
            "Financial Fraud": "FFR",
            "Drug Sales": "NAR",
            "Weapons Sales": "WPN",
            "Hacking Services": "CYB",
            "Fake Documents": "DOC",
            "Normal": "GEN"
        }
        code = category_codes.get(category, "UNK")
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        return f"CASE-{code}-{timestamp}-{self.report_counter:03d}"
    
    def _hash_content(self, content: str) -> str:
        """Generate content hash for integrity."""
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def _extract_evidence(
        self, 
        text: str, 
        category: str, 
        keywords: List[str]
    ) -> tuple[List[EvidenceItem], List[EvidenceItem]]:
        """Extract key indicators and supporting evidence."""
        key_indicators = []
        supporting_evidence = []
        evidence_counter = 0
        
        text_lower = text.lower()
        
        # Extract keyword-based evidence
        for keyword in keywords:
            evidence_counter += 1
            
            # Find context around keyword
            idx = text_lower.find(keyword.lower())
            if idx >= 0:
                start = max(0, idx - 30)
                end = min(len(text), idx + len(keyword) + 30)
                context = text[start:end]
            else:
                context = f"Keyword detected: {keyword}"
            
            # Determine relevance
            if keyword.lower() in ['fullz', 'cvv', 'ssn', 'ransomware', '0day', 
                                   'fentanyl', 'automatic', 'ghost gun']:
                relevance = "HIGH"
                evidence_list = key_indicators
            else:
                relevance = "MEDIUM"
                evidence_list = supporting_evidence
            
            evidence_list.append(EvidenceItem(
                evidence_id=f"EV-{evidence_counter:03d}",
                evidence_type="keyword",
                value=keyword,
                context=context,
                relevance=relevance,
                category_link=category
            ))
        
        # Extract contact method evidence
        contact_patterns = {
            "telegram": r'@[\w]+|t\.me/[\w]+|telegram[\s:]+[\w]+',
            "wickr": r'wickr[\s:]+[\w]+',
            "email": r'[\w\.-]+@[\w\.-]+\.\w+',
            "onion": r'[\w]+\.onion',
            "session": r'session[\s:]+[\w]+'
        }
        
        for contact_type, pattern in contact_patterns.items():
            matches = re.findall(pattern, text_lower)
            for match in matches:
                evidence_counter += 1
                key_indicators.append(EvidenceItem(
                    evidence_id=f"EV-{evidence_counter:03d}",
                    evidence_type="contact",
                    value=match,
                    context=f"{contact_type.capitalize()} contact method detected",
                    relevance="HIGH",
                    category_link="Communication"
                ))
        
        # Extract price/payment evidence
        payment_patterns = [
            (r'\$[\d,]+', "USD pricing"),
            (r'[\d.]+\s*btc', "Bitcoin payment"),
            (r'[\d.]+\s*xmr', "Monero payment"),
            (r'crypto\s*only', "Cryptocurrency restriction"),
            (r'escrow', "Escrow service"),
        ]
        
        for pattern, description in payment_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                evidence_counter += 1
                supporting_evidence.append(EvidenceItem(
                    evidence_id=f"EV-{evidence_counter:03d}",
                    evidence_type="indicator",
                    value=match,
                    context=description,
                    relevance="MEDIUM",
                    category_link="Financial"
                ))
        
        return key_indicators[:10], supporting_evidence[:10]
    
    def _detect_geographic_indicators(self, text: str) -> List[str]:
        """Detect geographic indicators in text."""
        indicators = []
        text_check = text.lower() + " " + text
        
        for region, patterns in self.GEOGRAPHIC_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_check, re.IGNORECASE):
                    indicators.append(region)
                    break
        
        return list(set(indicators)) if indicators else ["Unspecified"]
    
    def _generate_executive_summary(
        self,
        category: str,
        confidence: float,
        risk_level: str,
        key_indicators: List[EvidenceItem]
    ) -> str:
        """Generate executive summary paragraph."""
        indicator_list = ", ".join([e.value for e in key_indicators[:5]])
        
        summary = (
            f"This content has been classified as {category} with {confidence:.0%} confidence. "
            f"Risk assessment: {risk_level}. "
        )
        
        if key_indicators:
            summary += f"Key indicators include: {indicator_list}. "
        
        activity = self.ACTIVITY_DESCRIPTIONS.get(category, {})
        if activity.get("likely_activity"):
            summary += f"The content likely advertises {activity['likely_activity'].lower()}."
        
        return summary
    
    def _generate_threat_assessment(
        self,
        category: str,
        risk_level: str,
        confidence: float,
        key_indicators: List[EvidenceItem]
    ) -> str:
        """Generate threat assessment paragraph."""
        assessments = {
            "CRITICAL": (
                "CRITICAL THREAT: This content represents an immediate and serious threat "
                "requiring urgent action. The combination of category, confidence level, "
                "and identified indicators suggests active criminal operation."
            ),
            "HIGH": (
                "HIGH THREAT: This content exhibits strong indicators of illegal activity. "
                "Priority investigation recommended. Actor appears to be actively "
                "engaged in criminal enterprise."
            ),
            "MEDIUM": (
                "MODERATE THREAT: Content contains indicators of potential illegal activity. "
                "Further investigation warranted to confirm nature and scope of activity."
            ),
            "LOW": (
                "LOW THREAT: Limited indicators of illegal activity detected. "
                "May warrant monitoring but does not require immediate action."
            ),
            "SAFE": (
                "MINIMAL THREAT: No significant indicators of criminal activity detected. "
                "Standard processing appropriate."
            )
        }
        
        base = assessments.get(risk_level, assessments["LOW"])
        
        # Add category-specific notes
        if category == "Weapons Sales":
            base += " NOTE: Weapons-related content should be treated as priority regardless of confidence."
        elif category == "Hacking Services" and any("0day" in e.value or "ransomware" in e.value for e in key_indicators):
            base += " NOTE: Advanced threat indicators detected - potential APT activity."
        
        return base
    
    def _generate_suggested_actions(
        self,
        category: str,
        risk_level: str,
        key_indicators: List[EvidenceItem]
    ) -> List[str]:
        """Generate list of suggested actions."""
        actions = []
        
        # Universal actions
        actions.append("Archive content for evidentiary purposes")
        
        # Risk-based actions
        if risk_level == "CRITICAL":
            actions.insert(0, "IMMEDIATE: Escalate to senior analyst and law enforcement liaison")
            actions.append("Initiate real-time monitoring of associated identifiers")
            actions.append("Cross-reference with ongoing investigations")
        elif risk_level == "HIGH":
            actions.append("Schedule priority review within 24 hours")
            actions.append("Check for related activity in intelligence databases")
        elif risk_level == "MEDIUM":
            actions.append("Add to watchlist for periodic monitoring")
        
        # Category-specific actions
        category_actions = {
            "Identity Theft": [
                "Check stolen data against known breach databases",
                "Alert identity theft task force if scale indicates bulk operation"
            ],
            "Financial Fraud": [
                "Cross-reference with financial institution fraud alerts",
                "Check for associated money mule recruitment"
            ],
            "Drug Sales": [
                "Check vendor reputation in known marketplace databases",
                "Monitor for shipping pattern indicators"
            ],
            "Weapons Sales": [
                "PRIORITY: Coordinate with ATF liaison",
                "Check for connections to known weapons trafficking networks"
            ],
            "Hacking Services": [
                "Assess potential targets in critical infrastructure",
                "Check for connections to known threat actors"
            ],
            "Fake Documents": [
                "Identify document types and issuing jurisdictions",
                "Alert relevant immigration/document fraud units"
            ]
        }
        
        if category in category_actions:
            actions.extend(category_actions[category])
        
        # Contact-based actions
        contacts = [e for e in key_indicators if e.evidence_type == "contact"]
        if contacts:
            actions.append("Monitor identified communication channels for related activity")
        
        return actions[:8]
    
    def _determine_response_timeline(self, risk_level: str) -> str:
        """Determine recommended response timeline."""
        timelines = {
            "CRITICAL": "Immediate (within 1 hour)",
            "HIGH": "Urgent (within 24 hours)",
            "MEDIUM": "Standard (within 72 hours)",
            "LOW": "Routine (within 1 week)",
            "SAFE": "As resources permit"
        }
        return timelines.get(risk_level, "Standard (within 72 hours)")
    
    def generate_report(
        self,
        text: str,
        category: str,
        confidence: float,
        risk_level: str,
        keywords: List[str],
        source: str = "Dark Web Monitoring",
        additional_data: Optional[Dict] = None
    ) -> IntelligenceReport:
        """
        Generate complete intelligence report.
        
        Args:
            text: Original content analyzed
            category: Predicted crime category
            confidence: Model confidence score
            risk_level: Risk level assessment
            keywords: Extracted keywords
            source: Content source
            additional_data: Any additional analysis data
            
        Returns:
            Complete IntelligenceReport
        """
        # Extract evidence
        key_indicators, supporting_evidence = self._extract_evidence(text, category, keywords)
        
        # Get activity descriptions
        activity_info = self.ACTIVITY_DESCRIPTIONS.get(category, self.ACTIVITY_DESCRIPTIONS["Normal"])
        
        # Detect geographic indicators
        geo_indicators = self._detect_geographic_indicators(text)
        
        # Generate summaries
        executive_summary = self._generate_executive_summary(
            category, confidence, risk_level, key_indicators
        )
        threat_assessment = self._generate_threat_assessment(
            category, risk_level, confidence, key_indicators
        )
        
        # Generate actions
        suggested_actions = self._generate_suggested_actions(category, risk_level, key_indicators)
        response_timeline = self._determine_response_timeline(risk_level)
        
        # Determine classification
        classification = ReportClassification.RESTRICTED
        if risk_level == "CRITICAL":
            classification = ReportClassification.CONFIDENTIAL
        
        # Determine secondary categories
        secondary_categories = []
        for cat in CRIME_CATEGORIES:
            if cat != category and cat != "Normal":
                if cat in SUSPICIOUS_KEYWORDS:
                    for kw in SUSPICIOUS_KEYWORDS[cat]:
                        if kw.lower() in text.lower():
                            secondary_categories.append(cat)
                            break
        
        report = IntelligenceReport(
            report_id=self._generate_report_id(),
            case_number=self._generate_case_number(category),
            report_date=datetime.utcnow(),
            classification=classification,
            status=ReportStatus.PENDING_REVIEW if risk_level in ["CRITICAL", "HIGH"] else ReportStatus.DRAFT,
            analyst_id=self.analyst_id,
            executive_summary=executive_summary,
            threat_assessment=threat_assessment,
            original_content=text,
            content_hash=self._hash_content(text),
            content_source=source,
            primary_category=category,
            category_confidence=confidence,
            secondary_categories=secondary_categories[:3],
            risk_level=risk_level,
            key_indicators=key_indicators,
            supporting_evidence=supporting_evidence,
            likely_activity=activity_info.get("likely_activity", "Unknown"),
            modus_operandi=activity_info.get("modus_operandi", "Unknown"),
            actor_profile=activity_info.get("actor_profile", "Unknown"),
            geographic_indicators=geo_indicators,
            suggested_actions=suggested_actions,
            priority_level=risk_level,
            response_timeline=response_timeline,
            related_cases=[],
            external_references=[],
            processing_metadata={
                "generated_at": datetime.utcnow().isoformat(),
                "model_confidence": confidence,
                "keyword_count": len(keywords),
                "evidence_count": len(key_indicators) + len(supporting_evidence),
                **(additional_data or {})
            }
        )
        
        return report
    
    def get_report_summary(self, report: IntelligenceReport) -> Dict:
        """Get JSON-serializable report summary."""
        return {
            "report_id": report.report_id,
            "case_number": report.case_number,
            "report_date": report.report_date.isoformat(),
            "classification": report.classification.value,
            "status": report.status.value,
            "analyst_id": report.analyst_id,
            "executive_summary": report.executive_summary,
            "threat_assessment": report.threat_assessment,
            "content_preview": report.original_content[:200] + "..." if len(report.original_content) > 200 else report.original_content,
            "content_hash": report.content_hash,
            "content_source": report.content_source,
            "primary_category": report.primary_category,
            "category_confidence": round(report.category_confidence, 2),
            "secondary_categories": report.secondary_categories,
            "risk_level": report.risk_level,
            "key_indicators": [
                {
                    "id": e.evidence_id,
                    "type": e.evidence_type,
                    "value": e.value,
                    "context": e.context,
                    "relevance": e.relevance
                }
                for e in report.key_indicators
            ],
            "supporting_evidence": [
                {
                    "id": e.evidence_id,
                    "type": e.evidence_type,
                    "value": e.value,
                    "relevance": e.relevance
                }
                for e in report.supporting_evidence
            ],
            "intelligence_assessment": {
                "likely_activity": report.likely_activity,
                "modus_operandi": report.modus_operandi,
                "actor_profile": report.actor_profile,
                "geographic_indicators": report.geographic_indicators
            },
            "recommendations": {
                "suggested_actions": report.suggested_actions,
                "priority_level": report.priority_level,
                "response_timeline": report.response_timeline
            },
            "metadata": report.processing_metadata
        }
    
    def generate_text_report(self, report: IntelligenceReport) -> str:
        """Generate formatted text report for display/export."""
        separator = "=" * 70
        
        text_report = f"""
{separator}
                    INTELLIGENCE REPORT
{separator}

REPORT ID: {report.report_id}
CASE NUMBER: {report.case_number}
DATE: {report.report_date.strftime("%Y-%m-%d %H:%M:%S UTC")}
CLASSIFICATION: {report.classification.value}
STATUS: {report.status.value}
ANALYST: {report.analyst_id}

{separator}
                    EXECUTIVE SUMMARY
{separator}

{report.executive_summary}

{separator}
                    THREAT ASSESSMENT
{separator}

{report.threat_assessment}

{separator}
                    CLASSIFICATION RESULTS
{separator}

Primary Category: {report.primary_category}
Confidence: {report.category_confidence:.0%}
Risk Level: {report.risk_level}
Secondary Categories: {', '.join(report.secondary_categories) if report.secondary_categories else 'None'}

{separator}
                    KEY INDICATORS
{separator}

"""
        for i, indicator in enumerate(report.key_indicators, 1):
            text_report += f"{i}. [{indicator.relevance}] {indicator.evidence_type.upper()}: {indicator.value}\n"
            text_report += f"   Context: {indicator.context}\n\n"
        
        if not report.key_indicators:
            text_report += "No key indicators identified.\n\n"
        
        text_report += f"""
{separator}
                    INTELLIGENCE ASSESSMENT
{separator}

LIKELY ACTIVITY:
{report.likely_activity}

MODUS OPERANDI:
{report.modus_operandi}

ACTOR PROFILE:
{report.actor_profile}

GEOGRAPHIC INDICATORS: {', '.join(report.geographic_indicators)}

{separator}
                    RECOMMENDED ACTIONS
{separator}

Priority Level: {report.priority_level}
Response Timeline: {report.response_timeline}

Actions:
"""
        for i, action in enumerate(report.suggested_actions, 1):
            text_report += f"  {i}. {action}\n"
        
        text_report += f"""
{separator}
                    CONTENT SAMPLE
{separator}

Source: {report.content_source}
Hash: {report.content_hash}

---
{report.original_content[:500]}{'...' if len(report.original_content) > 500 else ''}
---

{separator}
                    END OF REPORT
{separator}
Generated by: AI Investigator Report Generator
Timestamp: {datetime.utcnow().isoformat()}
"""
        return text_report


# Singleton instance
_generator = None

def get_report_generator(analyst_id: str = "AI-SYSTEM") -> InvestigatorReportGenerator:
    """Get or create singleton generator instance."""
    global _generator
    if _generator is None:
        _generator = InvestigatorReportGenerator(analyst_id)
    return _generator


if __name__ == "__main__":
    # Test the report generator
    generator = InvestigatorReportGenerator()
    
    test_text = """
    Fresh fullz available! Complete packages including SSN, DOB, MMN.
    Verified seller with 500+ successful transactions.
    Contact: Telegram @darkvendor
    Payment: BTC only, escrow accepted
    Bulk discounts for orders over 100 units.
    US domestic shipping available.
    """
    
    report = generator.generate_report(
        text=test_text,
        category="Identity Theft",
        confidence=0.92,
        risk_level="HIGH",
        keywords=["fullz", "ssn", "dob", "btc", "escrow", "vendor"],
        source="Dark Web Monitoring"
    )
    
    print(generator.generate_text_report(report))
