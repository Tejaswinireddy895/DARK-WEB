"""
FastAPI Application for Cybercrime Detection

REST API endpoints for text classification with:
- /predict - Classify text
- /health - Health check
- /metrics - Model metrics
- /auth/* - Authentication endpoints
"""

import sys
from pathlib import Path
import time
from typing import List, Optional
from contextlib import asynccontextmanager

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, EmailStr
import uvicorn

from config import CRIME_CATEGORIES, RISK_LEVELS, API_CONFIG, MODELS_DIR
from src.utils.logger import get_logger
from api.auth import (
    create_user, authenticate_user, create_access_token, decode_token,
    get_user_by_id, update_user, update_user_settings, change_password
)
from api.database import (
    initialize_database, check_database_status, save_analysis,
    get_user_analysis_history, get_all_analysis_history, get_analysis_stats,
    delete_analysis, clear_user_history
)


# ============================================================================
# Pydantic Models
# ============================================================================

class PredictRequest(BaseModel):
    """Request model for prediction endpoint."""
    text: str = Field(..., min_length=1, max_length=10000, 
                      description="Text to classify")
    model_type: Optional[str] = Field(default="baseline", 
                                       description="Model type: 'baseline' or 'bert'")

class PredictResponse(BaseModel):
    """Response model for prediction endpoint."""
    category: str
    confidence: float
    risk_level: str
    keywords: List[str]
    all_probabilities: dict
    processing_time: float

class BatchPredictRequest(BaseModel):
    """Request model for batch prediction."""
    texts: List[str] = Field(..., min_length=1, max_length=100)
    model_type: Optional[str] = Field(default="baseline")

class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str
    model_loaded: bool
    model_type: str
    version: str = "1.0.0"

class MetricsResponse(BaseModel):
    """Response model for metrics endpoint."""
    accuracy: Optional[float]
    f1_score: Optional[float]
    categories: List[str]
    num_categories: int
    model_type: str


# ============================================================================
# Authentication Models
# ============================================================================

class RegisterRequest(BaseModel):
    """Request model for user registration."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")
    name: str = Field(..., min_length=1, max_length=100, description="User's full name")

class LoginRequest(BaseModel):
    """Request model for user login."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class TokenResponse(BaseModel):
    """Response model for login/register."""
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    """Response model for user data."""
    id: str
    email: str
    name: str
    role: str
    avatar: Optional[str]
    created_at: str
    settings: dict

class UpdateProfileRequest(BaseModel):
    """Request model for profile update."""
    name: Optional[str] = None
    avatar: Optional[str] = None

class UpdateSettingsRequest(BaseModel):
    """Request model for settings update."""
    theme: Optional[str] = None
    notifications: Optional[bool] = None
    default_model: Optional[str] = None
    auto_analyze: Optional[bool] = None
    language: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    """Request model for password change."""
    old_password: str
    new_password: str = Field(..., min_length=6)


# Security
security = HTTPBearer(auto_error=False)


# ============================================================================
# Application Setup
# ============================================================================

# Global predictor cache - both models cached for fast switching
predictors = {}
logger = get_logger()


# ============================================================================
# Authentication Dependencies
# ============================================================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    user = get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user if authenticated, None otherwise."""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = decode_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        return get_user_by_id(user_id)
    except Exception:
        return None


def get_predictor(model_type: str = "baseline"):
    """Get or create a cached predictor for the given model type."""
    global predictors
    if model_type not in predictors:
        from src.inference.predictor import Predictor
        predictors[model_type] = Predictor(model_type=model_type)
    return predictors[model_type]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown."""
    global predictors
    # Startup
    logger.info("Starting Cybercrime Detection API...")
    
    # Initialize MongoDB
    db_connected = initialize_database()
    if db_connected:
        logger.info("MongoDB connected successfully")
    else:
        logger.warning("MongoDB not available, using fallback storage")
    
    # Try to preload a model (BERT preferred, baseline fallback)
    try:
        bert_path = MODELS_DIR / "bert" / "final_model"
        if bert_path.exists():
            predictor = get_predictor("bert")
            predictor.load_model()
            logger.info("BERT model preloaded")
        else:
            # Try baseline as fallback
            baseline_path = MODELS_DIR / "baseline" / "logistic_regression_model.pkl"
            if baseline_path.exists():
                predictor = get_predictor("baseline")
                predictor.load_model()
                logger.info("Baseline model preloaded")
    except Exception as e:
        logger.warning(f"Model preload skipped: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API...")


app = FastAPI(
    title="Cybercrime Content Detection API",
    description="AI-powered API to detect and classify cybercrime-related text",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Endpoints
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Cybercrime Content Detection API",
        "version": "1.0.0",
        "endpoints": {
            "predict": "/predict",
            "batch_predict": "/predict/batch",
            "health": "/health",
            "metrics": "/metrics"
        }
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API health and model status."""
    global predictors
    
    # Check if any model is loaded
    loaded_types = [k for k, v in predictors.items() if v._is_loaded]
    model_loaded = len(loaded_types) > 0
    model_type = loaded_types[0] if loaded_types else "none"
    
    return HealthResponse(
        status="healthy",
        model_loaded=model_loaded,
        model_type=model_type
    )


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict(
    request: PredictRequest,
    current_user: dict = Depends(get_optional_user)
):
    """
    Classify text into cybercrime categories.
    
    Returns:
    - category: Predicted crime category
    - confidence: Confidence score (0-1)
    - risk_level: Risk level (SAFE, LOW, MEDIUM, HIGH, CRITICAL)
    - keywords: Suspicious keywords found
    - all_probabilities: Probabilities for all categories
    """
    import uuid
    from datetime import datetime
    
    # Try requested model, fallback to bert if baseline fails
    model_type = request.model_type
    predictor = get_predictor(model_type)
    
    try:
        # Load model if not loaded
        predictor.load_model()
        
        # Get prediction
        result = predictor.predict(request.text)
        
        # Save to MongoDB if connected
        analysis_record = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"] if current_user else None,
            "text": request.text[:500],  # Store truncated text
            "text_length": len(request.text),
            "model_type": model_type,
            "category": result['category'],
            "confidence": result['confidence'],
            "risk_level": result['risk_level'],
            "keywords": result['keywords'],
            "processing_time": result['processing_time'],
            "timestamp": datetime.utcnow().isoformat()
        }
        save_analysis(analysis_record)
        
        return PredictResponse(
            category=result['category'],
            confidence=result['confidence'],
            risk_level=result['risk_level'],
            keywords=result['keywords'],
            all_probabilities=result['all_probabilities'],
            processing_time=result['processing_time']
        )
    
    except Exception as e:
        # If baseline fails, try BERT as fallback
        if model_type == "baseline":
            try:
                predictor = get_predictor("bert")
                predictor.load_model()
                result = predictor.predict(request.text)
                
                return PredictResponse(
                    category=result['category'],
                    confidence=result['confidence'],
                    risk_level=result['risk_level'],
                    keywords=result['keywords'],
                    all_probabilities=result['all_probabilities'],
                    processing_time=result['processing_time']
                )
            except Exception as bert_error:
                logger.log_error(bert_error, {"text_length": len(request.text)})
                raise HTTPException(
                    status_code=500,
                    detail=f"Prediction failed: {str(bert_error)}"
                )
        
        logger.log_error(e, {"text_length": len(request.text)})
        logger.log_error(e, {"text_length": len(request.text)})
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


@app.post("/predict/batch", tags=["Prediction"])
async def batch_predict(request: BatchPredictRequest):
    """
    Classify multiple texts at once.
    
    Maximum 100 texts per request.
    """
    predictor = get_predictor(request.model_type)
    
    try:
        predictor.load_model()
        results = predictor.batch_predict(request.texts)
        
        return {
            "predictions": results,
            "count": len(results)
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.log_error(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics", response_model=MetricsResponse, tags=["Metrics"])
async def get_metrics():
    """Get model performance metrics."""
    global predictors
    
    # Get first loaded predictor
    loaded = [(k, v) for k, v in predictors.items() if v._is_loaded]
    
    if not loaded:
        return MetricsResponse(
            accuracy=None,
            f1_score=None,
            categories=CRIME_CATEGORIES,
            num_categories=len(CRIME_CATEGORIES),
            model_type="not_loaded"
        )
    
    model_type, predictor = loaded[0]
    model_info = predictor.get_model_info()
    metrics = model_info.get('metrics', {})
    
    return MetricsResponse(
        accuracy=metrics.get('accuracy'),
        f1_score=metrics.get('f1_weighted'),
        categories=CRIME_CATEGORIES,
        num_categories=len(CRIME_CATEGORIES),
        model_type=model_type
    )


@app.get("/categories", tags=["Info"])
async def get_categories():
    """Get list of crime categories and risk levels."""
    return {
        "categories": CRIME_CATEGORIES,
        "risk_levels": RISK_LEVELS
    }


# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/auth/register", response_model=TokenResponse, tags=["Authentication"])
async def register(request: RegisterRequest):
    """
    Register a new user account.
    
    Returns access token and user data on success.
    """
    try:
        user = create_user(
            email=request.email,
            password=request.password,
            name=request.name
        )
        
        access_token = create_access_token({"sub": user["id"], "email": user["email"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.log_error(e, context=f"Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(request: LoginRequest):
    """
    Login with email and password.
    
    Returns access token and user data on success.
    """
    user = authenticate_user(request.email, request.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return TokenResponse(
        access_token=access_token,
        user=user
    )


@app.get("/auth/me", tags=["Authentication"])
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user's profile.
    
    Requires valid JWT token in Authorization header.
    """
    return current_user


@app.put("/auth/profile", tags=["Authentication"])
async def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile (name, avatar).
    """
    updates = {}
    if request.name is not None:
        updates["name"] = request.name
    if request.avatar is not None:
        updates["avatar"] = request.avatar
    
    if not updates:
        return current_user
    
    updated = update_user(current_user["id"], updates)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update profile")
    
    return updated


@app.put("/auth/settings", tags=["Authentication"])
async def update_settings(
    request: UpdateSettingsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's settings.
    """
    settings = {}
    if request.theme is not None:
        settings["theme"] = request.theme
    if request.notifications is not None:
        settings["notifications"] = request.notifications
    if request.default_model is not None:
        settings["default_model"] = request.default_model
    if request.auto_analyze is not None:
        settings["auto_analyze"] = request.auto_analyze
    if request.language is not None:
        settings["language"] = request.language
    
    if not settings:
        return current_user
    
    updated = update_user_settings(current_user["id"], settings)
    if not updated:
        raise HTTPException(status_code=400, detail="Failed to update settings")
    
    return updated


@app.put("/auth/password", tags=["Authentication"])
async def change_user_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Change current user's password.
    """
    success = change_password(
        current_user["id"],
        request.old_password,
        request.new_password
    )
    
    if not success:
        raise HTTPException(status_code=400, detail="Invalid current password")
    
    return {"message": "Password changed successfully"}


# ============================================================================
# Analysis History Endpoints
# ============================================================================

@app.get("/history", tags=["History"])
async def get_history(
    limit: int = 100,
    current_user: dict = Depends(get_optional_user)
):
    """
    Get analysis history. Returns user-specific history if authenticated,
    otherwise returns general history.
    """
    if current_user:
        history = get_user_analysis_history(current_user["id"], limit)
    else:
        history = get_all_analysis_history(limit)
    
    return {"history": history, "count": len(history)}


@app.get("/history/stats", tags=["History"])
async def get_history_stats():
    """
    Get analysis statistics.
    """
    stats = get_analysis_stats()
    return stats


@app.delete("/history/{analysis_id}", tags=["History"])
async def delete_history_item(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific analysis from history.
    """
    success = delete_analysis(analysis_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {"message": "Analysis deleted successfully"}


@app.delete("/history", tags=["History"])
async def clear_history(current_user: dict = Depends(get_current_user)):
    """
    Clear all analysis history for current user.
    """
    count = clear_user_history(current_user["id"])
    return {"message": f"Deleted {count} analysis records"}


@app.get("/database/status", tags=["Info"])
async def database_status():
    """
    Check database connection status.
    """
    return check_database_status()


# ============================================================================
# Intelligence Analysis Endpoints
# ============================================================================

class AdvancedAnalysisRequest(BaseModel):
    """Request model for advanced analysis with threat prioritization."""
    text: str = Field(..., min_length=1, max_length=10000)
    model_type: Optional[str] = Field(default="baseline")
    include_report: Optional[bool] = Field(default=True)
    include_cross_lingual: Optional[bool] = Field(default=True)
    source: Optional[str] = Field(default="API Analysis")


class ThreatAlertResponse(BaseModel):
    """Response model for threat alert."""
    alert_id: str
    threat_level: dict
    alert_priority: str
    risk_score: float
    category: str
    confidence: float
    keywords: List[str]
    indicators: List[str]
    recommended_actions: List[str]
    response_timeline: str
    score_breakdown: dict
    volume_trend: str


@app.post("/analyze/advanced", tags=["Intelligence Analysis"])
async def advanced_analysis(
    request: AdvancedAnalysisRequest,
    current_user: dict = Depends(get_optional_user)
):
    """
    Perform advanced threat analysis with:
    - AI prediction
    - Threat prioritization (SOC workflow)
    - Cross-lingual analysis
    - Intelligence report generation
    
    Returns comprehensive threat intelligence package.
    """
    from src.intelligence.threat_prioritizer import get_prioritizer
    from src.intelligence.cross_lingual import get_cross_lingual_analyzer
    from src.intelligence.report_generator import get_report_generator
    import uuid
    from datetime import datetime
    
    # Get prediction first
    predictor = get_predictor(request.model_type)
    predictor.load_model()
    prediction = predictor.predict(request.text)
    
    # Get threat prioritization
    prioritizer = get_prioritizer()
    alert = prioritizer.prioritize(
        text=request.text,
        category=prediction['category'],
        confidence=prediction['confidence'],
        keywords=prediction['keywords']
    )
    alert_summary = prioritizer.get_alert_summary(alert)
    
    # Get cross-lingual analysis
    cross_lingual_result = None
    if request.include_cross_lingual:
        analyzer = get_cross_lingual_analyzer()
        analysis = analyzer.analyze(request.text)
        cross_lingual_result = analyzer.get_analysis_summary(analysis)
    
    # Generate intelligence report
    report_result = None
    if request.include_report:
        generator = get_report_generator()
        report = generator.generate_report(
            text=request.text,
            category=prediction['category'],
            confidence=prediction['confidence'],
            risk_level=prediction['risk_level'],
            keywords=prediction['keywords'],
            source=request.source,
            additional_data={
                "threat_level": alert_summary["threat_level"]["level"],
                "alert_priority": alert_summary["alert_priority"]
            }
        )
        report_result = generator.get_report_summary(report)
    
    # Save to MongoDB
    analysis_record = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"] if current_user else None,
        "text": request.text[:500],
        "model_type": request.model_type,
        "category": prediction['category'],
        "confidence": prediction['confidence'],
        "risk_level": prediction['risk_level'],
        "threat_level": alert_summary["threat_level"]["level"],
        "alert_priority": alert_summary["alert_priority"],
        "risk_score": alert_summary["risk_score"],
        "keywords": prediction['keywords'],
        "timestamp": datetime.utcnow().isoformat(),
        "analysis_type": "advanced"
    }
    save_analysis(analysis_record)
    
    return {
        "prediction": {
            "category": prediction['category'],
            "confidence": prediction['confidence'],
            "risk_level": prediction['risk_level'],
            "keywords": prediction['keywords'],
            "all_probabilities": prediction['all_probabilities'],
            "processing_time": prediction['processing_time']
        },
        "threat_alert": alert_summary,
        "cross_lingual_analysis": cross_lingual_result,
        "intelligence_report": report_result
    }


@app.post("/analyze/prioritize", tags=["Intelligence Analysis"])
async def prioritize_threat(
    request: PredictRequest,
    current_user: dict = Depends(get_optional_user)
):
    """
    Prioritize a threat and get SOC-style alert with:
    - Threat level (🔴 Critical, 🟠 High, 🟡 Watchlist, 🟢 Low)
    - Alert priority (IMMEDIATE, URGENT, ELEVATED, ROUTINE)
    - Risk score (0-100)
    - Recommended actions
    - Response timeline
    """
    from src.intelligence.threat_prioritizer import get_prioritizer
    
    # Get prediction
    predictor = get_predictor(request.model_type)
    predictor.load_model()
    prediction = predictor.predict(request.text)
    
    # Prioritize
    prioritizer = get_prioritizer()
    alert = prioritizer.prioritize(
        text=request.text,
        category=prediction['category'],
        confidence=prediction['confidence'],
        keywords=prediction['keywords']
    )
    
    return prioritizer.get_alert_summary(alert)


@app.get("/alerts/stats", tags=["Intelligence Analysis"])
async def get_alert_stats():
    """
    Get alert statistics for dashboard.
    Returns counts by threat level and priority.
    """
    from src.intelligence.threat_prioritizer import get_prioritizer
    
    prioritizer = get_prioritizer()
    return prioritizer.get_dashboard_stats()


@app.post("/analyze/cross-lingual", tags=["Intelligence Analysis"])
async def analyze_cross_lingual(request: PredictRequest):
    """
    Perform cross-lingual crime intelligence analysis.
    
    Detects and analyzes content across:
    - English
    - Russian
    - Chinese
    - Arabic
    - Hindi/Hinglish
    
    Returns normalized content with slang mappings and cultural context.
    """
    from src.intelligence.cross_lingual import get_cross_lingual_analyzer
    
    analyzer = get_cross_lingual_analyzer()
    analysis = analyzer.analyze(request.text)
    
    return analyzer.get_analysis_summary(analysis)


@app.post("/analyze/report", tags=["Intelligence Analysis"])
async def generate_investigation_report(
    request: AdvancedAnalysisRequest,
    current_user: dict = Depends(get_optional_user)
):
    """
    Generate a police-style intelligence report (Case File Mode).
    
    Creates structured investigation report with:
    - Executive summary
    - Threat assessment
    - Key indicators
    - Intelligence assessment
    - Recommended actions
    """
    from src.intelligence.report_generator import get_report_generator
    
    # Get prediction
    predictor = get_predictor(request.model_type)
    predictor.load_model()
    prediction = predictor.predict(request.text)
    
    # Generate report
    generator = get_report_generator(
        analyst_id=current_user["email"] if current_user else "AI-SYSTEM"
    )
    report = generator.generate_report(
        text=request.text,
        category=prediction['category'],
        confidence=prediction['confidence'],
        risk_level=prediction['risk_level'],
        keywords=prediction['keywords'],
        source=request.source
    )
    
    return generator.get_report_summary(report)


@app.post("/analyze/report/text", tags=["Intelligence Analysis"])
async def generate_text_report(
    request: AdvancedAnalysisRequest,
    current_user: dict = Depends(get_optional_user)
):
    """
    Generate a formatted text intelligence report for printing/export.
    
    Returns plain text report in police intelligence format.
    """
    from src.intelligence.report_generator import get_report_generator
    
    # Get prediction
    predictor = get_predictor(request.model_type)
    predictor.load_model()
    prediction = predictor.predict(request.text)
    
    # Generate report
    generator = get_report_generator(
        analyst_id=current_user["email"] if current_user else "AI-SYSTEM"
    )
    report = generator.generate_report(
        text=request.text,
        category=prediction['category'],
        confidence=prediction['confidence'],
        risk_level=prediction['risk_level'],
        keywords=prediction['keywords'],
        source=request.source
    )
    
    return {
        "report_id": report.report_id,
        "case_number": report.case_number,
        "text_report": generator.generate_text_report(report)
    }


# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=API_CONFIG["host"],
        port=API_CONFIG["port"],
        reload=API_CONFIG["debug"]
    )
