"""
Text Preprocessing Pipeline

Provides utilities for cleaning, tokenizing, and preprocessing text data
for the cybercrime detection model.
"""

import re
import string
from typing import List, Optional
import unicodedata


class TextProcessor:
    """
    Text preprocessing pipeline for cybercrime detection.
    
    Handles:
    - Lowercase conversion
    - Special character removal
    - URL/email removal
    - Tokenization
    - Stop word removal
    """
    
    # Common stop words (minimal set to preserve domain-specific terms)
    STOP_WORDS = {
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'this',
        'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
        'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all',
        'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
        'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
        'also', 'now', 'here', 'there', 'then', 'once', 'if', 'any', 'as', 'up',
        'out', 'about', 'into', 'over', 'after', 'before', 'between', 'under',
        'again', 'further', 'while', 'through', 'during', 'above', 'below'
    }
    
    # URL pattern
    URL_PATTERN = re.compile(
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+|'
        r'www\.(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+|'
        r'(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}'
    )
    
    # Email pattern
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    
    # Bitcoin/crypto address pattern
    CRYPTO_PATTERN = re.compile(r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b|\b0x[a-fA-F0-9]{40}\b')
    
    def __init__(self, 
                 lowercase: bool = True,
                 remove_urls: bool = True,
                 remove_emails: bool = True,
                 remove_special_chars: bool = True,
                 remove_numbers: bool = False,
                 remove_stopwords: bool = False,
                 min_word_length: int = 2):
        """
        Initialize the text processor.
        
        Args:
            lowercase: Convert text to lowercase
            remove_urls: Remove URLs from text
            remove_emails: Remove email addresses
            remove_special_chars: Remove special characters
            remove_numbers: Remove numeric characters
            remove_stopwords: Remove common stop words
            min_word_length: Minimum word length to keep
        """
        self.lowercase = lowercase
        self.remove_urls = remove_urls
        self.remove_emails = remove_emails
        self.remove_special_chars = remove_special_chars
        self.remove_numbers = remove_numbers
        self.remove_stopwords = remove_stopwords
        self.min_word_length = min_word_length
    
    def clean_text(self, text: str) -> str:
        """
        Clean text by removing unwanted elements.
        
        Args:
            text: Input text string
            
        Returns:
            Cleaned text string
        """
        if not text or not isinstance(text, str):
            return ""
        
        # Normalize unicode
        text = unicodedata.normalize('NFKD', text)
        
        # Remove URLs
        if self.remove_urls:
            text = self.URL_PATTERN.sub(' [URL] ', text)
        
        # Remove emails
        if self.remove_emails:
            text = self.EMAIL_PATTERN.sub(' [EMAIL] ', text)
        
        # Replace crypto addresses
        text = self.CRYPTO_PATTERN.sub(' [CRYPTO] ', text)
        
        # Lowercase
        if self.lowercase:
            text = text.lower()
        
        # Remove special characters but keep some meaningful ones
        if self.remove_special_chars:
            # Keep $ for prices, # for hashtags, @ for mentions
            text = re.sub(r'[^\w\s$#@]', ' ', text)
        
        # Remove numbers (optional)
        if self.remove_numbers:
            text = re.sub(r'\d+', ' [NUM] ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text.strip()
    
    def tokenize(self, text: str) -> List[str]:
        """
        Tokenize text into words.
        
        Args:
            text: Input text string
            
        Returns:
            List of tokens
        """
        # Simple whitespace tokenization
        tokens = text.split()
        
        # Filter by minimum length
        tokens = [t for t in tokens if len(t) >= self.min_word_length]
        
        # Remove stop words if enabled
        if self.remove_stopwords:
            tokens = [t for t in tokens if t.lower() not in self.STOP_WORDS]
        
        return tokens
    
    def preprocess(self, text: str) -> str:
        """
        Full preprocessing pipeline.
        
        Args:
            text: Input text string
            
        Returns:
            Preprocessed text string
        """
        # Clean
        text = self.clean_text(text)
        
        # Tokenize and rejoin
        tokens = self.tokenize(text)
        
        return ' '.join(tokens)
    
    def preprocess_batch(self, texts: List[str]) -> List[str]:
        """
        Preprocess a batch of texts.
        
        Args:
            texts: List of text strings
            
        Returns:
            List of preprocessed text strings
        """
        return [self.preprocess(text) for text in texts]


# Convenience function for quick preprocessing
def preprocess_text(text: str, 
                   lowercase: bool = True,
                   remove_urls: bool = True,
                   remove_stopwords: bool = False) -> str:
    """
    Quick preprocessing function.
    
    Args:
        text: Input text
        lowercase: Convert to lowercase
        remove_urls: Remove URLs
        remove_stopwords: Remove stop words
        
    Returns:
        Preprocessed text
    """
    processor = TextProcessor(
        lowercase=lowercase,
        remove_urls=remove_urls,
        remove_stopwords=remove_stopwords
    )
    return processor.preprocess(text)


if __name__ == "__main__":
    # Test the processor
    processor = TextProcessor()
    
    test_texts = [
        "Selling fresh CC dumps at https://example.com - contact me@email.com",
        "Buy MDMA 500mg pills. Shipping worldwide. BTC: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "Looking for VPN recommendations for privacy? Check out this guide!",
        "FULLZ available - SSN, DOB, MMN included. $15 each. DM for wickr"
    ]
    
    print("Text Preprocessing Examples:")
    print("=" * 60)
    for text in test_texts:
        cleaned = processor.preprocess(text)
        print(f"Original: {text}")
        print(f"Cleaned:  {cleaned}")
        print("-" * 60)
