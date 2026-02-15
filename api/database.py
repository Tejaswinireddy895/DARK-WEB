"""
MongoDB Database Module for Cybercrime Detection API

Provides:
- MongoDB connection management
- User collection operations
- Analysis history storage
- Settings storage
"""

import os
from datetime import datetime
from typing import Optional, List
from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

# MongoDB connection settings (use environment variables in production)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("MONGO_DB_NAME", "cybercrime_detection")

# Collection names
USERS_COLLECTION = "users"
ANALYSIS_COLLECTION = "analysis_history"
SETTINGS_COLLECTION = "app_settings"


# ============================================================================
# Database Connection
# ============================================================================

class Database:
    """MongoDB database connection manager."""
    
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def connect(self) -> bool:
        """Establish connection to MongoDB."""
        try:
            self._client = MongoClient(
                MONGO_URI, 
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            # Test connection
            self._client.admin.command('ping')
            self._db = self._client[DATABASE_NAME]
            
            # Create indexes
            self._create_indexes()
            
            logger.info(f"Connected to MongoDB: {DATABASE_NAME}")
            return True
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.warning(f"MongoDB connection failed: {e}. Using fallback storage.")
            self._client = None
            self._db = None
            return False
    
    def _create_indexes(self):
        """Create necessary indexes for collections."""
        if self._db is not None:
            # Users collection indexes
            self._db[USERS_COLLECTION].create_index("email", unique=True)
            self._db[USERS_COLLECTION].create_index("id", unique=True)
            
            # Analysis collection indexes
            self._db[ANALYSIS_COLLECTION].create_index("user_id")
            self._db[ANALYSIS_COLLECTION].create_index([("timestamp", DESCENDING)])
            self._db[ANALYSIS_COLLECTION].create_index("category")
    
    @property
    def db(self):
        """Get database instance."""
        if self._db is None:
            self.connect()
        return self._db
    
    @property
    def is_connected(self) -> bool:
        """Check if connected to MongoDB."""
        return self._db is not None
    
    def close(self):
        """Close database connection."""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None


# Global database instance
db = Database()


# ============================================================================
# User Operations
# ============================================================================

def get_users_collection():
    """Get users collection."""
    if db.is_connected:
        return db.db[USERS_COLLECTION]
    return None


def insert_user(user_data: dict) -> bool:
    """Insert a new user into MongoDB."""
    collection = get_users_collection()
    if collection is not None:
        try:
            collection.insert_one(user_data)
            return True
        except Exception as e:
            logger.error(f"Failed to insert user: {e}")
    return False


def find_user_by_email(email: str) -> Optional[dict]:
    """Find user by email."""
    collection = get_users_collection()
    if collection is not None:
        user = collection.find_one({"email": email.lower()})
        if user:
            user.pop('_id', None)  # Remove MongoDB _id
            return user
    return None


def find_user_by_id(user_id: str) -> Optional[dict]:
    """Find user by ID."""
    collection = get_users_collection()
    if collection is not None:
        user = collection.find_one({"id": user_id})
        if user:
            user.pop('_id', None)
            return user
    return None


def update_user_data(user_id: str, updates: dict) -> Optional[dict]:
    """Update user data."""
    collection = get_users_collection()
    if collection is not None:
        updates["updated_at"] = datetime.utcnow().isoformat()
        result = collection.find_one_and_update(
            {"id": user_id},
            {"$set": updates},
            return_document=True
        )
        if result:
            result.pop('_id', None)
            return result
    return None


def update_user_password(user_id: str, hashed_password: str) -> bool:
    """Update user password."""
    collection = get_users_collection()
    if collection is not None:
        result = collection.update_one(
            {"id": user_id},
            {"$set": {
                "password": hashed_password,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        return result.modified_count > 0
    return False


# ============================================================================
# Analysis History Operations
# ============================================================================

def get_analysis_collection():
    """Get analysis collection."""
    if db.is_connected:
        return db.db[ANALYSIS_COLLECTION]
    return None


def save_analysis(analysis_data: dict) -> bool:
    """Save an analysis result to MongoDB."""
    collection = get_analysis_collection()
    if collection is not None:
        try:
            # Add timestamp if not present
            if "timestamp" not in analysis_data:
                analysis_data["timestamp"] = datetime.utcnow().isoformat()
            
            collection.insert_one(analysis_data)
            return True
        except Exception as e:
            logger.error(f"Failed to save analysis: {e}")
    return False


def get_user_analysis_history(user_id: str, limit: int = 100) -> List[dict]:
    """Get analysis history for a user."""
    collection = get_analysis_collection()
    if collection is not None:
        results = collection.find(
            {"user_id": user_id}
        ).sort("timestamp", DESCENDING).limit(limit)
        
        return [{k: v for k, v in doc.items() if k != '_id'} for doc in results]
    return []


def get_all_analysis_history(limit: int = 100) -> List[dict]:
    """Get all analysis history (for anonymous users or admin)."""
    collection = get_analysis_collection()
    if collection is not None:
        results = collection.find().sort("timestamp", DESCENDING).limit(limit)
        return [{k: v for k, v in doc.items() if k != '_id'} for doc in results]
    return []


def get_analysis_stats() -> dict:
    """Get analysis statistics."""
    collection = get_analysis_collection()
    if collection is not None:
        total = collection.count_documents({})
        
        # Category breakdown
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        category_stats = list(collection.aggregate(pipeline))
        
        # Risk level breakdown
        risk_pipeline = [
            {"$group": {"_id": "$risk_level", "count": {"$sum": 1}}}
        ]
        risk_stats = list(collection.aggregate(risk_pipeline))
        
        return {
            "total_analyses": total,
            "by_category": {item["_id"]: item["count"] for item in category_stats if item["_id"]},
            "by_risk_level": {item["_id"]: item["count"] for item in risk_stats if item["_id"]}
        }
    return {"total_analyses": 0, "by_category": {}, "by_risk_level": {}}


def delete_analysis(analysis_id: str, user_id: str = None) -> bool:
    """Delete an analysis record."""
    collection = get_analysis_collection()
    if collection is not None:
        query = {"id": analysis_id}
        if user_id:
            query["user_id"] = user_id
        
        result = collection.delete_one(query)
        return result.deleted_count > 0
    return False


def clear_user_history(user_id: str) -> int:
    """Clear all analysis history for a user."""
    collection = get_analysis_collection()
    if collection is not None:
        result = collection.delete_many({"user_id": user_id})
        return result.deleted_count
    return 0


# ============================================================================
# Database Status
# ============================================================================

def check_database_status() -> dict:
    """Check MongoDB connection status."""
    return {
        "connected": db.is_connected,
        "database": DATABASE_NAME if db.is_connected else None,
        "uri": MONGO_URI.split("@")[-1] if db.is_connected else None  # Hide credentials
    }


def initialize_database():
    """Initialize database connection on startup."""
    return db.connect()
