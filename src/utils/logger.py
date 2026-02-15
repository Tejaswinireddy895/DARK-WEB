"""
Logging Utility

Provides structured logging for predictions and system events.
"""

import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import sys

# Add parent path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config import LOGGING_CONFIG, LOGS_DIR


class PredictionLogger:
    """
    Logger for tracking predictions and system events.
    
    Provides:
    - Structured JSON logging
    - Prediction audit trail
    - Performance metrics logging
    """
    
    def __init__(self, log_file: Optional[Path] = None):
        """
        Initialize the logger.
        
        Args:
            log_file: Path to log file (uses default from config if None)
        """
        self.log_file = log_file or LOGGING_CONFIG["log_file"]
        self.log_file = Path(self.log_file)
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Set up standard logger
        self.logger = logging.getLogger("cybercrime_detector")
        self.logger.setLevel(getattr(logging, LOGGING_CONFIG["level"]))
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(LOGGING_CONFIG["format"])
        console_handler.setFormatter(console_formatter)
        
        # File handler
        file_handler = logging.FileHandler(self.log_file, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(console_formatter)
        
        # Add handlers if not already added
        if not self.logger.handlers:
            self.logger.addHandler(console_handler)
            self.logger.addHandler(file_handler)
    
    def log_prediction(self, 
                       text: str,
                       prediction: str,
                       confidence: float,
                       keywords: list,
                       risk_level: str,
                       processing_time: float,
                       model_type: str = "unknown") -> None:
        """
        Log a prediction event.
        
        Args:
            text: Input text (will be truncated for privacy)
            prediction: Predicted category
            confidence: Confidence score
            keywords: Highlighted keywords
            risk_level: Risk level (SAFE, LOW, MEDIUM, HIGH, CRITICAL)
            processing_time: Time taken for prediction in seconds
            model_type: Type of model used
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event": "prediction",
            "text_preview": text[:100] + "..." if len(text) > 100 else text,
            "text_length": len(text),
            "prediction": prediction,
            "confidence": round(confidence, 4),
            "keywords_count": len(keywords),
            "keywords": keywords[:10],  # Limit for log size
            "risk_level": risk_level,
            "processing_time_ms": round(processing_time * 1000, 2),
            "model_type": model_type
        }
        
        self.logger.info(f"Prediction: {prediction} ({confidence:.2%}) - Risk: {risk_level}")
        self._write_json_log(log_entry)
    
    def log_error(self, error: Exception, context: Dict[str, Any] = None) -> None:
        """
        Log an error event.
        
        Args:
            error: Exception that occurred
            context: Additional context information
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event": "error",
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {}
        }
        
        self.logger.error(f"Error: {type(error).__name__}: {error}")
        self._write_json_log(log_entry)
    
    def log_model_load(self, model_type: str, load_time: float) -> None:
        """
        Log model loading event.
        
        Args:
            model_type: Type of model loaded
            load_time: Time taken to load in seconds
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event": "model_load",
            "model_type": model_type,
            "load_time_ms": round(load_time * 1000, 2)
        }
        
        self.logger.info(f"Model loaded: {model_type} in {load_time:.2f}s")
        self._write_json_log(log_entry)
    
    def log_api_request(self, 
                        endpoint: str, 
                        method: str,
                        status_code: int,
                        response_time: float) -> None:
        """
        Log API request.
        
        Args:
            endpoint: API endpoint called
            method: HTTP method
            status_code: Response status code
            response_time: Response time in seconds
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event": "api_request",
            "endpoint": endpoint,
            "method": method,
            "status_code": status_code,
            "response_time_ms": round(response_time * 1000, 2)
        }
        
        self.logger.info(f"API: {method} {endpoint} -> {status_code} ({response_time:.3f}s)")
        self._write_json_log(log_entry)
    
    def _write_json_log(self, entry: Dict[str, Any]) -> None:
        """Write a JSON log entry to the log file."""
        try:
            with open(self.log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception as e:
            self.logger.warning(f"Failed to write JSON log: {e}")
    
    def info(self, message: str) -> None:
        """Log info message."""
        self.logger.info(message)
    
    def warning(self, message: str) -> None:
        """Log warning message."""
        self.logger.warning(message)
    
    def error(self, message: str) -> None:
        """Log error message."""
        self.logger.error(message)
    
    def debug(self, message: str) -> None:
        """Log debug message."""
        self.logger.debug(message)


# Global logger instance
_logger = None

def get_logger() -> PredictionLogger:
    """Get or create the global logger instance."""
    global _logger
    if _logger is None:
        _logger = PredictionLogger()
    return _logger


if __name__ == "__main__":
    # Test logging
    logger = get_logger()
    logger.info("Logger test started")
    logger.log_prediction(
        text="Test text for prediction logging",
        prediction="Financial Fraud",
        confidence=0.95,
        keywords=["dumps", "cc", "cvv"],
        risk_level="HIGH",
        processing_time=0.234,
        model_type="baseline"
    )
    logger.info("Logger test completed")
