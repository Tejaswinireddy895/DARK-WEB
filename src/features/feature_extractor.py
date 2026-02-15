"""
Feature Extraction Module

Provides TF-IDF and BERT-based feature extraction for text classification.
"""

import numpy as np
from typing import List, Optional, Union
from pathlib import Path
import pickle
import sys

# Add parent paths
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class TFIDFExtractor:
    """
    TF-IDF feature extractor for baseline models.
    
    Uses scikit-learn's TfidfVectorizer for efficient text vectorization.
    """
    
    def __init__(self, 
                 max_features: int = 5000,
                 ngram_range: tuple = (1, 2),
                 min_df: int = 2,
                 max_df: float = 0.95):
        """
        Initialize TF-IDF extractor.
        
        Args:
            max_features: Maximum number of features
            ngram_range: Range of n-grams to extract
            min_df: Minimum document frequency
            max_df: Maximum document frequency
        """
        from sklearn.feature_extraction.text import TfidfVectorizer
        
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            ngram_range=ngram_range,
            min_df=min_df,
            max_df=max_df,
            strip_accents='unicode',
            lowercase=True,
            stop_words='english'
        )
        self.is_fitted = False
    
    def fit(self, texts: List[str]) -> 'TFIDFExtractor':
        """
        Fit the vectorizer on texts.
        
        Args:
            texts: List of text documents
            
        Returns:
            Self for chaining
        """
        self.vectorizer.fit(texts)
        self.is_fitted = True
        return self
    
    def transform(self, texts: List[str]) -> np.ndarray:
        """
        Transform texts to TF-IDF features.
        
        Args:
            texts: List of text documents
            
        Returns:
            TF-IDF feature matrix
        """
        if not self.is_fitted:
            raise ValueError("Vectorizer not fitted. Call fit() first.")
        return self.vectorizer.transform(texts)
    
    def fit_transform(self, texts: List[str]) -> np.ndarray:
        """
        Fit and transform texts to TF-IDF features.
        
        Args:
            texts: List of text documents
            
        Returns:
            TF-IDF feature matrix
        """
        self.is_fitted = True
        return self.vectorizer.fit_transform(texts)
    
    def get_feature_names(self) -> List[str]:
        """Get feature names (vocabulary)."""
        return self.vectorizer.get_feature_names_out().tolist()
    
    def save(self, filepath: Union[str, Path]) -> None:
        """Save the vectorizer to disk."""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'wb') as f:
            pickle.dump(self.vectorizer, f)
    
    def load(self, filepath: Union[str, Path]) -> 'TFIDFExtractor':
        """Load a vectorizer from disk."""
        with open(filepath, 'rb') as f:
            self.vectorizer = pickle.load(f)
        self.is_fitted = True
        return self


class BERTExtractor:
    """
    BERT-based feature extractor for deep learning models.
    
    Uses Hugging Face Transformers for tokenization and embeddings.
    """
    
    def __init__(self, 
                 model_name: str = "distilbert-base-uncased",
                 max_length: int = 256,
                 device: str = None):
        """
        Initialize BERT extractor.
        
        Args:
            model_name: Hugging Face model name
            max_length: Maximum sequence length
            device: Device to use ('cuda', 'cpu', or None for auto)
        """
        self.model_name = model_name
        self.max_length = max_length
        self.tokenizer = None
        self.model = None
        self.device = device
        self._initialized = False
    
    def _initialize(self):
        """Lazy initialization of model and tokenizer."""
        if self._initialized:
            return
            
        import torch
        from transformers import AutoTokenizer, AutoModel
        
        # Determine device
        if self.device is None:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # Load tokenizer and model
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModel.from_pretrained(self.model_name)
        self.model.to(self.device)
        self.model.eval()
        
        self._initialized = True
    
    def tokenize(self, texts: List[str]) -> dict:
        """
        Tokenize texts for BERT.
        
        Args:
            texts: List of text documents
            
        Returns:
            Dictionary with input_ids, attention_mask, etc.
        """
        self._initialize()
        
        return self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt"
        )
    
    def extract_embeddings(self, texts: List[str], batch_size: int = 16) -> np.ndarray:
        """
        Extract BERT embeddings (CLS token) for texts.
        
        Args:
            texts: List of text documents
            batch_size: Batch size for processing
            
        Returns:
            Embedding matrix [num_texts, hidden_size]
        """
        import torch
        
        self._initialize()
        
        all_embeddings = []
        
        with torch.no_grad():
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                inputs = self.tokenize(batch)
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                outputs = self.model(**inputs)
                
                # Get CLS token embeddings
                cls_embeddings = outputs.last_hidden_state[:, 0, :].cpu().numpy()
                all_embeddings.append(cls_embeddings)
        
        return np.vstack(all_embeddings)
    
    def get_tokenizer(self):
        """Get the tokenizer for external use."""
        self._initialize()
        return self.tokenizer
    
    def get_model(self):
        """Get the model for external use."""
        self._initialize()
        return self.model


def get_feature_extractor(extractor_type: str = "tfidf", **kwargs):
    """
    Factory function to get a feature extractor.
    
    Args:
        extractor_type: Type of extractor ('tfidf' or 'bert')
        **kwargs: Additional arguments for the extractor
        
    Returns:
        Feature extractor instance
    """
    if extractor_type.lower() == "tfidf":
        return TFIDFExtractor(**kwargs)
    elif extractor_type.lower() == "bert":
        return BERTExtractor(**kwargs)
    else:
        raise ValueError(f"Unknown extractor type: {extractor_type}")


if __name__ == "__main__":
    # Test feature extractors
    texts = [
        "Selling fresh CC dumps with high balance",
        "Looking for VPN recommendations",
        "Fake passport available for EU countries"
    ]
    
    print("Testing TF-IDF Extractor...")
    tfidf = TFIDFExtractor(max_features=100)
    features = tfidf.fit_transform(texts)
    print(f"TF-IDF features shape: {features.shape}")
    print(f"Features: {features.toarray()[:, :10]}")
    
    print("\nTesting BERT Extractor...")
    try:
        bert = BERTExtractor()
        embeddings = bert.extract_embeddings(texts)
        print(f"BERT embeddings shape: {embeddings.shape}")
    except ImportError as e:
        print(f"BERT not available (install transformers): {e}")
