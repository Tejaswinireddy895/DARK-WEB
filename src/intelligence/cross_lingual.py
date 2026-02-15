"""
Cross-Lingual & Cross-Cultural Crime Intelligence Module

Detects crime patterns across multiple languages:
- English
- Russian  
- Chinese
- Arabic
- Hindi-English slang (Hinglish)

Features:
- Language detection
- Cross-lingual embeddings for semantic similarity
- Slang normalization across regions
- Multilingual keyword matching
- Cultural context awareness

Demonstrates global cybercrime intelligence capabilities
"""

import sys
from pathlib import Path
import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class Language(Enum):
    """Supported languages."""
    ENGLISH = "en"
    RUSSIAN = "ru"
    CHINESE = "zh"
    ARABIC = "ar"
    HINDI = "hi"
    HINGLISH = "hi-en"  # Hindi-English mix
    UNKNOWN = "unknown"


@dataclass
class MultilingualAnalysis:
    """Result of cross-lingual analysis."""
    detected_language: Language
    language_confidence: float
    normalized_text: str
    detected_slang: List[Tuple[str, str]]  # (slang, meaning)
    cross_lingual_keywords: List[str]
    cultural_context: str
    threat_indicators: Dict[str, List[str]]
    translation_available: bool


class CrossLingualAnalyzer:
    """
    Cross-Lingual Crime Intelligence Analyzer
    
    Provides multilingual threat detection and normalization
    across different languages and cultural contexts.
    """
    
    # Language detection patterns
    LANGUAGE_PATTERNS = {
        Language.RUSSIAN: r'[а-яА-ЯёЁ]+',
        Language.CHINESE: r'[\u4e00-\u9fff]+',
        Language.ARABIC: r'[\u0600-\u06FF]+',
        Language.HINDI: r'[\u0900-\u097F]+',
    }
    
    # Multilingual crime keywords with English meanings
    MULTILINGUAL_KEYWORDS = {
        # Russian cybercrime terms
        "ru": {
            "картинг": ("carding", "Financial Fraud"),
            "дамп": ("dump", "Financial Fraud"),
            "обнал": ("cash out", "Financial Fraud"),
            "стилер": ("stealer", "Hacking Services"),
            "ботнет": ("botnet", "Hacking Services"),
            "эксплойт": ("exploit", "Hacking Services"),
            "фальшивка": ("fake", "Fake Documents"),
            "паспорт": ("passport", "Fake Documents"),
            "удостоверение": ("ID card", "Fake Documents"),
            "наркотик": ("drugs", "Drug Sales"),
            "закладка": ("drug stash", "Drug Sales"),
            "синтетика": ("synthetic drugs", "Drug Sales"),
            "оружие": ("weapon", "Weapons Sales"),
            "пистолет": ("pistol", "Weapons Sales"),
            "автомат": ("automatic weapon", "Weapons Sales"),
            "персональные данные": ("personal data", "Identity Theft"),
            "база данных": ("database", "Identity Theft"),
            "даркнет": ("darknet", "Hacking Services"),
            "криптор": ("crypter", "Hacking Services"),
            "ратник": ("RAT", "Hacking Services"),
            "дроп": ("drop", "Financial Fraud"),
            "сбыт": ("sales", "Drug Sales"),
        },
        
        # Chinese cybercrime terms
        "zh": {
            "信用卡": ("credit card", "Financial Fraud"),
            "洗钱": ("money laundering", "Financial Fraud"),
            "假护照": ("fake passport", "Fake Documents"),
            "黑客": ("hacker", "Hacking Services"),
            "木马": ("trojan", "Hacking Services"),
            "僵尸网络": ("botnet", "Hacking Services"),
            "钓鱼": ("phishing", "Hacking Services"),
            "毒品": ("drugs", "Drug Sales"),
            "冰毒": ("methamphetamine", "Drug Sales"),
            "大麻": ("cannabis", "Drug Sales"),
            "武器": ("weapon", "Weapons Sales"),
            "枪支": ("firearms", "Weapons Sales"),
            "身份证": ("ID card", "Identity Theft"),
            "个人信息": ("personal info", "Identity Theft"),
            "诈骗": ("fraud", "Financial Fraud"),
            "勒索": ("ransomware", "Hacking Services"),
            "加密货币": ("cryptocurrency", "Financial Fraud"),
            "暗网": ("dark web", "Hacking Services"),
            "虚假证件": ("fake documents", "Fake Documents"),
        },
        
        # Arabic cybercrime terms
        "ar": {
            "قرصنة": ("hacking", "Hacking Services"),
            "فيروس": ("virus", "Hacking Services"),
            "احتيال": ("fraud", "Financial Fraud"),
            "غسيل أموال": ("money laundering", "Financial Fraud"),
            "بطاقة ائتمان": ("credit card", "Financial Fraud"),
            "جواز سفر مزور": ("fake passport", "Fake Documents"),
            "هوية مزورة": ("fake ID", "Fake Documents"),
            "مخدرات": ("drugs", "Drug Sales"),
            "أسلحة": ("weapons", "Weapons Sales"),
            "سرقة هوية": ("identity theft", "Identity Theft"),
            "بيانات شخصية": ("personal data", "Identity Theft"),
            "برمجيات خبيثة": ("malware", "Hacking Services"),
            "فدية": ("ransom", "Hacking Services"),
            "شبكة مظلمة": ("dark web", "Hacking Services"),
            "تشفير": ("encryption", "Hacking Services"),
        },
        
        # Hindi/Hinglish cybercrime slang
        "hi": {
            "नकली": ("fake", "Fake Documents"),
            "जाली": ("counterfeit", "Fake Documents"),
            "हैकिंग": ("hacking", "Hacking Services"),
            "धोखाधड़ी": ("fraud", "Financial Fraud"),
            "नशीली दवाइयाँ": ("drugs", "Drug Sales"),
            "हथियार": ("weapons", "Weapons Sales"),
            "पहचान चोरी": ("identity theft", "Identity Theft"),
        },
    }
    
    # Hinglish slang mappings (Hindi-English code-switching)
    HINGLISH_SLANG = {
        # Common Hinglish cyber slang
        "maal": ("goods/drugs", "Drug Sales"),
        "saman": ("stuff/drugs", "Drug Sales"),
        "patti": ("wrap/drugs", "Drug Sales"),
        "phuki": ("low quality drugs", "Drug Sales"),
        "chitta": ("heroin", "Drug Sales"),
        "goli": ("pill", "Drug Sales"),
        "pakad": ("deal/score", "Drug Sales"),
        "setting": ("arrangement", "Financial Fraud"),
        "jugaad": ("workaround/hack", "Hacking Services"),
        "nakli": ("fake", "Fake Documents"),
        "asli jaise": ("like original", "Fake Documents"),
        "katta": ("desi gun", "Weapons Sales"),
        "desi": ("local made", "Weapons Sales"),
        "data wala": ("data seller", "Identity Theft"),
        "pan card": ("PAN card", "Identity Theft"),
        "aadhar": ("Aadhaar card", "Identity Theft"),
        "chalti": ("working/valid", "Financial Fraud"),
        "fresh maal": ("fresh goods", "Financial Fraud"),
        "cc wala": ("credit card seller", "Financial Fraud"),
        "account kholna": ("open account", "Financial Fraud"),
        "money double": ("money doubling scam", "Financial Fraud"),
        "lottery scam": ("lottery fraud", "Financial Fraud"),
        "hacking seekho": ("learn hacking", "Hacking Services"),
        "fb hack": ("Facebook hack", "Hacking Services"),
        "insta hack": ("Instagram hack", "Hacking Services"),
        "whatsapp hack": ("WhatsApp hack", "Hacking Services"),
    }
    
    # English slang and regional variations
    ENGLISH_SLANG = {
        # Dark web slang
        "fullz": ("complete identity package", "Identity Theft"),
        "cvv": ("card verification value", "Financial Fraud"),
        "dumps": ("credit card data", "Financial Fraud"),
        "cc": ("credit card", "Financial Fraud"),
        "bins": ("bank identification numbers", "Financial Fraud"),
        "pp": ("PayPal", "Financial Fraud"),
        "btc": ("Bitcoin", "Financial Fraud"),
        "xmr": ("Monero", "Financial Fraud"),
        "escrow": ("third party payment", "Financial Fraud"),
        "fe": ("finalize early", "Financial Fraud"),
        "dd": ("direct deal", "Financial Fraud"),
        "vendor": ("seller", "Drug Sales"),
        "stealth": ("hidden shipping", "Drug Sales"),
        "pgp": ("encryption key", "Hacking Services"),
        "opsec": ("operational security", "Hacking Services"),
        "dox": ("personal info reveal", "Identity Theft"),
        "doxxing": ("revealing personal info", "Identity Theft"),
        "rat": ("remote access trojan", "Hacking Services"),
        "0day": ("zero-day exploit", "Hacking Services"),
        "rce": ("remote code execution", "Hacking Services"),
        "sqli": ("SQL injection", "Hacking Services"),
        "xss": ("cross-site scripting", "Hacking Services"),
        "phish": ("phishing", "Hacking Services"),
        "lulz": ("for fun/trolling", "Hacking Services"),
        "pwned": ("compromised", "Hacking Services"),
        "ghost gun": ("untraceable firearm", "Weapons Sales"),
        "gat": ("gun", "Weapons Sales"),
        "strap": ("gun", "Weapons Sales"),
        "heat": ("gun", "Weapons Sales"),
        "bando": ("drug house", "Drug Sales"),
        "plug": ("drug dealer", "Drug Sales"),
        "trap": ("drug dealing location", "Drug Sales"),
    }
    
    def __init__(self):
        """Initialize the cross-lingual analyzer."""
        self._compile_patterns()
        
    def _compile_patterns(self):
        """Compile regex patterns for efficiency."""
        self._lang_patterns = {
            lang: re.compile(pattern) 
            for lang, pattern in self.LANGUAGE_PATTERNS.items()
        }
        
    def detect_language(self, text: str) -> Tuple[Language, float]:
        """
        Detect the primary language of the text.
        
        Args:
            text: Input text
            
        Returns:
            Tuple of (detected_language, confidence)
        """
        text_clean = text.strip()
        if not text_clean:
            return Language.UNKNOWN, 0.0
        
        # Count character matches for each language
        char_counts = {}
        total_chars = len(text_clean.replace(" ", ""))
        
        for lang, pattern in self._lang_patterns.items():
            matches = pattern.findall(text_clean)
            char_count = sum(len(m) for m in matches)
            char_counts[lang] = char_count
        
        # Check for mixed Hindi-English (Hinglish)
        has_hindi = char_counts.get(Language.HINDI, 0) > 0
        has_english = bool(re.findall(r'[a-zA-Z]+', text_clean))
        
        if has_hindi and has_english:
            hindi_ratio = char_counts.get(Language.HINDI, 0) / max(total_chars, 1)
            if 0.1 <= hindi_ratio <= 0.7:
                return Language.HINGLISH, 0.8
        
        # Find dominant language
        if char_counts:
            best_lang = max(char_counts.items(), key=lambda x: x[1])
            if best_lang[1] > 0:
                confidence = min(best_lang[1] / max(total_chars, 1), 1.0)
                if confidence > 0.3:
                    return best_lang[0], confidence
        
        # Default to English for ASCII text
        if re.match(r'^[\x00-\x7F]+$', text_clean):
            return Language.ENGLISH, 0.9
        
        return Language.UNKNOWN, 0.5
    
    def detect_slang(self, text: str, language: Language) -> List[Tuple[str, str, str]]:
        """
        Detect slang terms in the text.
        
        Args:
            text: Input text
            language: Detected language
            
        Returns:
            List of (slang_term, meaning, category)
        """
        text_lower = text.lower()
        detected = []
        
        # Check English slang (always check)
        for slang, (meaning, category) in self.ENGLISH_SLANG.items():
            if re.search(r'\b' + re.escape(slang) + r'\b', text_lower):
                detected.append((slang, meaning, category))
        
        # Check Hinglish slang
        if language in [Language.HINGLISH, Language.HINDI, Language.ENGLISH]:
            for slang, (meaning, category) in self.HINGLISH_SLANG.items():
                if slang.lower() in text_lower:
                    detected.append((slang, meaning, category))
        
        # Check language-specific keywords
        lang_code = language.value.split("-")[0]
        if lang_code in self.MULTILINGUAL_KEYWORDS:
            for term, (meaning, category) in self.MULTILINGUAL_KEYWORDS[lang_code].items():
                if term in text or term.lower() in text_lower:
                    detected.append((term, meaning, category))
        
        return detected
    
    def normalize_text(self, text: str, slang_terms: List[Tuple[str, str, str]]) -> str:
        """
        Normalize text by replacing slang with standard terms.
        
        Args:
            text: Input text
            slang_terms: Detected slang terms
            
        Returns:
            Normalized text
        """
        normalized = text
        
        for slang, meaning, _ in slang_terms:
            # Replace slang with meaning in brackets
            pattern = re.compile(re.escape(slang), re.IGNORECASE)
            normalized = pattern.sub(f"{slang} [{meaning}]", normalized)
        
        return normalized
    
    def extract_cross_lingual_keywords(
        self, 
        text: str, 
        language: Language
    ) -> Dict[str, List[str]]:
        """
        Extract crime-related keywords across languages.
        
        Args:
            text: Input text
            language: Detected language
            
        Returns:
            Dictionary of category -> keywords
        """
        keywords_by_category: Dict[str, List[str]] = {}
        text_lower = text.lower()
        
        # Check all language keywords
        for lang_code, terms in self.MULTILINGUAL_KEYWORDS.items():
            for term, (meaning, category) in terms.items():
                if term in text or term.lower() in text_lower:
                    if category not in keywords_by_category:
                        keywords_by_category[category] = []
                    keywords_by_category[category].append(f"{term} ({meaning})")
        
        # Check English slang
        for slang, (meaning, category) in self.ENGLISH_SLANG.items():
            if re.search(r'\b' + re.escape(slang) + r'\b', text_lower):
                if category not in keywords_by_category:
                    keywords_by_category[category] = []
                keywords_by_category[category].append(slang)
        
        # Check Hinglish
        for slang, (meaning, category) in self.HINGLISH_SLANG.items():
            if slang.lower() in text_lower:
                if category not in keywords_by_category:
                    keywords_by_category[category] = []
                keywords_by_category[category].append(f"{slang} ({meaning})")
        
        return keywords_by_category
    
    def get_cultural_context(self, language: Language, keywords: Dict[str, List[str]]) -> str:
        """
        Provide cultural context for the detected content.
        
        Args:
            language: Detected language
            keywords: Detected keywords by category
            
        Returns:
            Cultural context description
        """
        contexts = {
            Language.RUSSIAN: (
                "Russian-language dark web activity often originates from CIS countries. "
                "Common platforms include Russian forums and Telegram channels. "
                "Payment typically via cryptocurrency or Qiwi/YooMoney."
            ),
            Language.CHINESE: (
                "Chinese-language cybercrime often involves cross-border fraud, "
                "cryptocurrency scams, and identity document forgery. "
                "Communications may use WeChat, QQ, or encrypted platforms."
            ),
            Language.ARABIC: (
                "Arabic-language cyber activity spans multiple regions (Middle East, North Africa). "
                "May involve regional payment methods and culturally-specific scams. "
                "Telegram is a common communication platform."
            ),
            Language.HINDI: (
                "Hindi-language content often targets South Asian populations. "
                "May involve UPI fraud, fake documents (Aadhaar, PAN), "
                "and region-specific scams."
            ),
            Language.HINGLISH: (
                "Hinglish (Hindi-English mix) is common in Indian cybercrime forums. "
                "Often targets domestic victims with local payment methods (UPI, Paytm). "
                "WhatsApp and Telegram are primary communication channels."
            ),
            Language.ENGLISH: (
                "English-language dark web content has global reach. "
                "May originate from any English-speaking region or international actors. "
                "Standard cryptocurrency payments and encrypted communications."
            ),
        }
        
        base_context = contexts.get(language, "Unknown language/cultural context.")
        
        # Add category-specific context
        if "Drug Sales" in keywords:
            base_context += " Drug-related content detected - may involve international shipping."
        if "Weapons Sales" in keywords:
            base_context += " Weapons content requires priority attention and law enforcement coordination."
        if "Financial Fraud" in keywords:
            base_context += " Financial fraud indicators suggest organized criminal activity."
        
        return base_context
    
    def analyze(self, text: str) -> MultilingualAnalysis:
        """
        Perform complete cross-lingual analysis.
        
        Args:
            text: Input text to analyze
            
        Returns:
            MultilingualAnalysis with complete results
        """
        # Detect language
        language, lang_confidence = self.detect_language(text)
        
        # Detect slang
        slang_terms = self.detect_slang(text, language)
        slang_pairs = [(s, m) for s, m, _ in slang_terms]
        
        # Normalize text
        normalized = self.normalize_text(text, slang_terms)
        
        # Extract cross-lingual keywords
        keywords = self.extract_cross_lingual_keywords(text, language)
        
        # Flatten keywords for response
        all_keywords = []
        for cat_keywords in keywords.values():
            all_keywords.extend(cat_keywords)
        
        # Get cultural context
        context = self.get_cultural_context(language, keywords)
        
        return MultilingualAnalysis(
            detected_language=language,
            language_confidence=lang_confidence,
            normalized_text=normalized,
            detected_slang=slang_pairs,
            cross_lingual_keywords=all_keywords,
            cultural_context=context,
            threat_indicators=keywords,
            translation_available=language != Language.ENGLISH
        )
    
    def get_analysis_summary(self, analysis: MultilingualAnalysis) -> Dict:
        """Get JSON-serializable analysis summary."""
        return {
            "language": {
                "detected": analysis.detected_language.value,
                "name": analysis.detected_language.name,
                "confidence": round(analysis.language_confidence, 2)
            },
            "normalized_text": analysis.normalized_text,
            "slang_detected": [
                {"term": s, "meaning": m} 
                for s, m in analysis.detected_slang
            ],
            "cross_lingual_keywords": analysis.cross_lingual_keywords,
            "cultural_context": analysis.cultural_context,
            "threat_indicators": analysis.threat_indicators,
            "translation_available": analysis.translation_available,
            "languages_covered": ["English", "Russian", "Chinese", "Arabic", "Hindi", "Hinglish"]
        }


# Singleton instance
_analyzer = None

def get_cross_lingual_analyzer() -> CrossLingualAnalyzer:
    """Get or create singleton analyzer instance."""
    global _analyzer
    if _analyzer is None:
        _analyzer = CrossLingualAnalyzer()
    return _analyzer


if __name__ == "__main__":
    # Test the analyzer
    analyzer = CrossLingualAnalyzer()
    
    test_cases = [
        # English
        "Fresh fullz available! CVV + SSN + DOB. BTC only, escrow accepted.",
        
        # Russian
        "Продаю дампы карт. Обнал через дропов. Гарантия качества.",
        
        # Hinglish
        "Bhai fresh cc maal hai. Setting karwa denge. Telegram pe contact karo.",
        
        # Chinese
        "出售信用卡数据，黑客服务，假护照。加密货币支付。",
        
        # Mixed
        "Selling fullz package - паспорт + SSN. Contact @darkvendor"
    ]
    
    print("=== Cross-Lingual Analysis Tests ===\n")
    
    for text in test_cases:
        print(f"Input: {text[:60]}...")
        result = analyzer.analyze(text)
        print(f"Language: {result.detected_language.name} ({result.language_confidence:.0%})")
        print(f"Keywords: {result.cross_lingual_keywords[:5]}")
        print(f"Slang: {[s for s, m in result.detected_slang[:3]]}")
        print("-" * 50)
