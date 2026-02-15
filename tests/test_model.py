"""
Model Tests

Unit tests for preprocessing and model components.
"""

import sys
from pathlib import Path
import pytest

# Add project root
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config import CRIME_CATEGORIES, SUSPICIOUS_KEYWORDS


class TestTextProcessor:
    """Test suite for text preprocessing."""
    
    def test_clean_text_lowercase(self):
        """Test lowercase conversion."""
        from src.preprocessing.text_processor import TextProcessor
        
        processor = TextProcessor(lowercase=True)
        result = processor.clean_text("HELLO WORLD")
        assert result == "hello world"
    
    def test_clean_text_url_removal(self):
        """Test URL removal."""
        from src.preprocessing.text_processor import TextProcessor
        
        processor = TextProcessor(remove_urls=True)
        result = processor.clean_text("Check https://example.com for more")
        assert "https://example.com" not in result
        assert "[URL]" in result or "check" in result.lower()
    
    def test_clean_text_email_removal(self):
        """Test email removal."""
        from src.preprocessing.text_processor import TextProcessor
        
        processor = TextProcessor(remove_emails=True)
        result = processor.clean_text("Contact me at test@example.com")
        assert "test@example.com" not in result
    
    def test_tokenize(self):
        """Test tokenization."""
        from src.preprocessing.text_processor import TextProcessor
        
        processor = TextProcessor(min_word_length=2)
        tokens = processor.tokenize("hello world a b")
        assert "hello" in tokens
        assert "world" in tokens
        assert "a" not in tokens  # Too short
    
    def test_preprocess_pipeline(self):
        """Test full preprocessing pipeline."""
        from src.preprocessing.text_processor import TextProcessor
        
        processor = TextProcessor()
        text = "Selling CC dumps at https://dark.web - contact@email.com"
        result = processor.preprocess(text)
        
        assert "selling" in result.lower()
        assert "https://dark.web" not in result


class TestFeatureExtractor:
    """Test suite for feature extraction."""
    
    def test_tfidf_fit_transform(self):
        """Test TF-IDF vectorization."""
        from src.features.feature_extractor import TFIDFExtractor
        
        texts = ["hello world", "world hello", "goodbye world"]
        extractor = TFIDFExtractor(max_features=100)
        features = extractor.fit_transform(texts)
        
        assert features.shape[0] == 3  # 3 documents
        assert features.shape[1] <= 100  # max features
    
    def test_tfidf_transform_after_fit(self):
        """Test TF-IDF transform on new data."""
        from src.features.feature_extractor import TFIDFExtractor
        
        train_texts = ["hello world", "goodbye world", "hello there", "test text"]
        extractor = TFIDFExtractor(max_features=50, min_df=1)
        extractor.fit(train_texts)
        
        test_texts = ["hello there"]
        features = extractor.transform(test_texts)
        
        assert features.shape[0] == 1


class TestConfig:
    """Test configuration values."""
    
    def test_crime_categories_count(self):
        """Test correct number of categories."""
        assert len(CRIME_CATEGORIES) == 7
    
    def test_crime_categories_has_normal(self):
        """Test Normal category exists."""
        assert "Normal" in CRIME_CATEGORIES
    
    def test_suspicious_keywords_exist(self):
        """Test suspicious keywords are defined."""
        assert len(SUSPICIOUS_KEYWORDS) > 0
        assert "Financial Fraud" in SUSPICIOUS_KEYWORDS
    
    def test_each_category_has_keywords(self):
        """Test each crime category (except Normal) has keywords."""
        for category in CRIME_CATEGORIES:
            if category != "Normal":
                assert category in SUSPICIOUS_KEYWORDS
                assert len(SUSPICIOUS_KEYWORDS[category]) > 0


class TestBaselineModel:
    """Test baseline model components."""
    
    def test_model_initialization(self):
        """Test model can be initialized."""
        from src.models.baseline_model import BaselineClassifier
        
        model = BaselineClassifier(model_type="logistic_regression")
        assert model.model_type == "logistic_regression"
        assert model.is_fitted == False
    
    def test_model_types(self):
        """Test both model types can be created."""
        from src.models.baseline_model import BaselineClassifier
        
        lr = BaselineClassifier(model_type="logistic_regression")
        svm = BaselineClassifier(model_type="svm")
        
        assert lr.model_type == "logistic_regression"
        assert svm.model_type == "svm"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
