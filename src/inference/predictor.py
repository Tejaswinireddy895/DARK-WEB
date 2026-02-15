"""
Prediction Service

Unified prediction interface that handles model loading, preprocessing,
prediction, and keyword highlighting.
"""

import time
from pathlib import Path
from typing import Dict, List, Optional, Union, Tuple
import re
import sys

# Add parent paths
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config import (
    CRIME_CATEGORIES, 
    RISK_LEVELS, 
    SUSPICIOUS_KEYWORDS, 
    MODELS_DIR
)
from src.preprocessing.text_processor import TextProcessor
from src.utils.logger import get_logger

# Pre-compile keyword patterns for faster matching
_KEYWORD_CACHE = {}
def _get_all_keywords_lower():
    """Get all keywords lowercased (cached)."""
    if 'all_keywords' not in _KEYWORD_CACHE:
        all_kw = {}
        for cat, keywords in SUSPICIOUS_KEYWORDS.items():
            all_kw[cat] = [kw.lower() for kw in keywords]
        _KEYWORD_CACHE['all_keywords'] = all_kw
    return _KEYWORD_CACHE['all_keywords']


class Predictor:
    """
    Unified prediction service for cybercrime detection.
    
    Features:
    - Lazy model loading
    - Both baseline (TF-IDF) and BERT models
    - Confidence scoring
    - Keyword highlighting
    - Risk level assignment
    """
    
    def __init__(self, 
                 model_type: str = "baseline",
                 model_path: Optional[Path] = None):
        """
        Initialize predictor.
        
        Args:
            model_type: Type of model ('baseline' or 'bert')
            model_path: Path to saved model (auto-detected if None)
        """
        self.model_type = model_type
        self.model_path = model_path
        self.model = None
        self.feature_extractor = None
        self.text_processor = TextProcessor()
        self.logger = get_logger()
        self._is_loaded = False
    
    def load_model(self) -> None:
        """Load the model and feature extractor."""
        if self._is_loaded:
            return
        
        start_time = time.time()
        
        if self.model_type == "baseline":
            self._load_baseline_model()
        elif self.model_type == "bert":
            self._load_bert_model()
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
        
        load_time = time.time() - start_time
        self.logger.log_model_load(self.model_type, load_time)
        self._is_loaded = True
    
    def _load_baseline_model(self) -> None:
        """Load baseline (TF-IDF + Logistic Regression) model."""
        from src.models.baseline_model import BaselineClassifier
        from src.features.feature_extractor import TFIDFExtractor
        
        model_path = self.model_path or MODELS_DIR / "baseline" / "logistic_regression_model.pkl"
        vectorizer_path = MODELS_DIR / "baseline" / "tfidf_vectorizer.pkl"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}. Train the model first.")
        
        self.model = BaselineClassifier.load(model_path)
        self.feature_extractor = TFIDFExtractor()
        
        if vectorizer_path.exists():
            self.feature_extractor.load(vectorizer_path)
        else:
            raise FileNotFoundError(f"Vectorizer not found: {vectorizer_path}")
    
    def _load_bert_model(self) -> None:
        """Load BERT model."""
        from src.models.bert_classifier import BERTClassifier
        
        model_path = self.model_path or MODELS_DIR / "bert" / "final_model"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}. Train the model first.")
        
        self.model = BERTClassifier.load(model_path)
    
    def predict(self, text: str) -> Dict:
        """
        Predict crime category for text.
        
        Args:
            text: Input text to classify
            
        Returns:
            Dictionary with prediction results:
            - category: Predicted category
            - confidence: Confidence score (0-1)
            - risk_level: Risk level (SAFE, LOW, MEDIUM, HIGH, CRITICAL)
            - keywords: List of suspicious keywords found
            - all_probabilities: Probabilities for all categories
        """
        start_time = time.time()
        
        # Ensure model is loaded
        self.load_model()
        
        # Preprocess text
        cleaned_text = self.text_processor.preprocess(text)
        
        # Get prediction based on model type
        if self.model_type == "baseline":
            result = self._predict_baseline(cleaned_text)
        else:
            result = self._predict_bert(cleaned_text)
        
        # Extract keywords
        keywords = self.extract_keywords(text, result['category'])
        result['keywords'] = keywords
        
        # Assign risk level
        result['risk_level'] = self._get_risk_level(
            result['category'], 
            result['confidence']
        )
        
        # Calculate processing time
        processing_time = time.time() - start_time
        result['processing_time'] = processing_time
        
        # Log prediction
        self.logger.log_prediction(
            text=text,
            prediction=result['category'],
            confidence=result['confidence'],
            keywords=keywords,
            risk_level=result['risk_level'],
            processing_time=processing_time,
            model_type=self.model_type
        )
        
        return result
    
    def _predict_baseline(self, text: str) -> Dict:
        """Predict using baseline model."""
        # Transform text to features
        features = self.feature_extractor.transform([text])
        
        # Get prediction and probabilities
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        
        # Get class names
        classes = self.model.get_classes()
        
        # Find confidence (max probability)
        confidence = float(max(probabilities))
        
        return {
            'category': prediction,
            'confidence': confidence,
            'all_probabilities': {
                classes[i]: float(probabilities[i]) 
                for i in range(len(classes))
            }
        }
    
    def _predict_bert(self, text: str) -> Dict:
        """Predict using BERT model."""
        predictions = self.model.predict(text)
        pred = predictions[0]
        
        return {
            'category': pred['label'],
            'confidence': pred['confidence'],
            'all_probabilities': pred['probabilities']
        }
    
    def extract_keywords(self, text: str, category: str) -> List[str]:
        """
        Extract suspicious keywords from text based on category.
        Uses cached lowercase keywords for faster matching.
        """
        found = set()
        text_lower = text.lower()
        all_keywords = _get_all_keywords_lower()
        
        # Check predicted category first (priority)
        if category in all_keywords:
            for kw in all_keywords[category]:
                if kw in text_lower:
                    found.add(kw)
        
        # Check other categories
        for cat, keywords in all_keywords.items():
            if cat != category:
                for kw in keywords:
                    if kw in text_lower:
                        found.add(kw)
        
        return list(found)[:15]
    
    def _get_risk_level(self, category: str, confidence: float) -> str:
        """
        Determine risk level based on category and confidence.
        
        Args:
            category: Predicted category
            confidence: Confidence score
            
        Returns:
            Risk level string
        """
        base_risk = RISK_LEVELS.get(category, "SAFE")
        
        # Adjust based on confidence
        if confidence < 0.5:
            return "LOW"
        elif confidence < 0.7:
            if base_risk == "CRITICAL":
                return "HIGH"
            elif base_risk == "HIGH":
                return "MEDIUM"
            return base_risk
        else:
            return base_risk
    
    def highlight_text(self, text: str, keywords: List[str]) -> str:
        """
        Return text with keywords highlighted using HTML spans.
        
        Args:
            text: Original text
            keywords: Keywords to highlight
            
        Returns:
            HTML string with highlighted keywords
        """
        highlighted = text
        for keyword in keywords:
            pattern = re.compile(re.escape(keyword), re.IGNORECASE)
            highlighted = pattern.sub(
                f'<span class="highlight">{keyword}</span>',
                highlighted
            )
        return highlighted
    
    def batch_predict(self, texts: List[str]) -> List[Dict]:
        """
        Predict for multiple texts.
        
        Args:
            texts: List of texts to classify
            
        Returns:
            List of prediction results
        """
        return [self.predict(text) for text in texts]
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model."""
        if not self._is_loaded:
            return {"status": "not_loaded", "model_type": self.model_type}
        
        info = {
            "status": "loaded",
            "model_type": self.model_type,
            "categories": CRIME_CATEGORIES,
            "num_categories": len(CRIME_CATEGORIES)
        }
        
        if self.model_type == "baseline" and hasattr(self.model, 'metrics'):
            info["metrics"] = self.model.metrics
        
        return info


# Create a default predictor instance
_default_predictor = None

def get_predictor(model_type: str = "baseline") -> Predictor:
    """Get or create the default predictor instance."""
    global _default_predictor
    if _default_predictor is None or _default_predictor.model_type != model_type:
        _default_predictor = Predictor(model_type=model_type)
    return _default_predictor


if __name__ == "__main__":
    # Test the predictor (requires trained model)
    print("Predictor module loaded successfully")
    print(f"Supported categories: {CRIME_CATEGORIES}")
    print(f"Risk levels: {RISK_LEVELS}")
