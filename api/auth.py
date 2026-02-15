"""
Authentication Module for Cybercrime Detection API

Provides:
- User registration and login
- JWT token generation and validation
- Password hashing with bcrypt
- MongoDB storage with JSON fallback
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import hashlib
import hmac
import base64
import secrets

# Import MongoDB operations
from api.database import (
    db, insert_user, find_user_by_email, find_user_by_id,
    update_user_data, update_user_password
)

# ============================================================================
# Configuration
# ============================================================================

# Secret key for JWT (in production, use environment variable)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cybercrime-detection-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Fallback JSON storage (used when MongoDB is unavailable)
DATA_DIR = Path(__file__).parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"


# ============================================================================
# Password Hashing (using hashlib for simplicity - no extra dependencies)
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt."""
    salt = secrets.token_hex(16)
    hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}${hash_obj.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    try:
        salt, stored_hash = hashed.split('$')
        hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return hmac.compare_digest(hash_obj.hex(), stored_hash)
    except Exception:
        return False


# ============================================================================
# JWT Token Handling (simple implementation without external deps)
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire.timestamp(), "iat": datetime.utcnow().timestamp()})
    
    # Create JWT manually (header.payload.signature)
    header = base64.urlsafe_b64encode(json.dumps({"alg": ALGORITHM, "typ": "JWT"}).encode()).decode().rstrip('=')
    payload = base64.urlsafe_b64encode(json.dumps(to_encode, default=str).encode()).decode().rstrip('=')
    
    signature_input = f"{header}.{payload}"
    signature = hmac.new(SECRET_KEY.encode(), signature_input.encode(), hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    return f"{header}.{payload}.{signature_b64}"


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header, payload, signature = parts
        
        # Verify signature
        signature_input = f"{header}.{payload}"
        expected_sig = hmac.new(SECRET_KEY.encode(), signature_input.encode(), hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode().rstrip('=')
        
        if not hmac.compare_digest(signature, expected_sig_b64):
            return None
        
        # Decode payload
        # Add padding if needed
        payload_padded = payload + '=' * (4 - len(payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(payload_padded))
        
        # Check expiration
        if data.get('exp', 0) < datetime.utcnow().timestamp():
            return None
        
        return data
    except Exception:
        return None


# ============================================================================
# User Database Operations (MongoDB with JSON fallback)
# ============================================================================

def ensure_data_dir():
    """Ensure data directory exists for fallback storage."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_users_json() -> dict:
    """Load users from JSON file (fallback)."""
    ensure_data_dir()
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_users_json(users: dict):
    """Save users to JSON file (fallback)."""
    ensure_data_dir()
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2, default=str)


def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email (MongoDB first, then JSON fallback)."""
    # Try MongoDB first
    user = find_user_by_email(email)
    if user:
        return user
    
    # Fallback to JSON
    users = load_users_json()
    return users.get(email.lower())


def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID (MongoDB first, then JSON fallback)."""
    # Try MongoDB first
    user = find_user_by_id(user_id)
    if user:
        return user
    
    # Fallback to JSON
    users = load_users_json()
    for user in users.values():
        if user.get('id') == user_id:
            return user
    return None


def create_user(email: str, password: str, name: str, role: str = "analyst") -> dict:
    """Create a new user (MongoDB first, then JSON fallback)."""
    email_lower = email.lower()
    
    # Check if user exists
    if get_user_by_email(email_lower):
        raise ValueError("User with this email already exists")
    
    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    user = {
        "id": user_id,
        "email": email_lower,
        "password": hash_password(password),
        "name": name,
        "role": role,
        "avatar": None,
        "created_at": now,
        "updated_at": now,
        "settings": {
            "theme": "dark",
            "notifications": True,
            "default_model": "bert",
            "auto_analyze": False,
            "language": "en"
        }
    }
    
    # Try MongoDB first
    if db.is_connected:
        if insert_user(user):
            # Remove password AND _id (MongoDB adds _id in-place)
            return {k: v for k, v in user.items() if k not in ('password', '_id')}
    
    # Fallback to JSON
    users = load_users_json()
    users[email_lower] = user
    save_users_json(users)
    
    # Return user without password
    return {k: v for k, v in user.items() if k not in ('password', '_id')}


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate user by email and password."""
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.get('password', '')):
        return None
    # Return user without password
    return {k: v for k, v in user.items() if k != 'password'}


def update_user(user_id: str, updates: dict) -> Optional[dict]:
    """Update user profile."""
    # Try MongoDB first
    if db.is_connected:
        # Filter allowed fields
        allowed_updates = {k: v for k, v in updates.items() if k in ['name', 'avatar']}
        result = update_user_data(user_id, allowed_updates)
        if result:
            result.pop('password', None)
            return result
    
    # Fallback to JSON
    users = load_users_json()
    
    for email, user in users.items():
        if user.get('id') == user_id:
            # Update allowed fields
            allowed_fields = ['name', 'avatar']
            for field in allowed_fields:
                if field in updates:
                    user[field] = updates[field]
            
            user['updated_at'] = datetime.utcnow().isoformat()
            users[email] = user
            save_users_json(users)
            
            return {k: v for k, v in user.items() if k != 'password'}
    
    return None


def update_user_settings(user_id: str, settings: dict) -> Optional[dict]:
    """Update user settings."""
    # Try MongoDB first
    if db.is_connected:
        user = find_user_by_id(user_id)
        if user:
            current_settings = user.get('settings', {})
            current_settings.update(settings)
            result = update_user_data(user_id, {"settings": current_settings})
            if result:
                result.pop('password', None)
                return result
    
    # Fallback to JSON
    users = load_users_json()
    
    for email, user in users.items():
        if user.get('id') == user_id:
            current_settings = user.get('settings', {})
            current_settings.update(settings)
            user['settings'] = current_settings
            user['updated_at'] = datetime.utcnow().isoformat()
            users[email] = user
            save_users_json(users)
            
            return {k: v for k, v in user.items() if k != 'password'}
    
    return None


def change_password(user_id: str, old_password: str, new_password: str) -> bool:
    """Change user password."""
    user = get_user_by_id(user_id)
    if not user:
        return False
    
    # Get full user with password
    full_user = None
    if db.is_connected:
        from api.database import get_users_collection
        collection = get_users_collection()
        if collection:
            full_user = collection.find_one({"id": user_id})
    
    if not full_user:
        users = load_users_json()
        for email, u in users.items():
            if u.get('id') == user_id:
                full_user = u
                break
    
    if not full_user:
        return False
    
    if not verify_password(old_password, full_user.get('password', '')):
        return False
    
    new_hashed = hash_password(new_password)
    
    # Try MongoDB first
    if db.is_connected:
        if update_user_password(user_id, new_hashed):
            return True
    
    # Fallback to JSON
    users = load_users_json()
    for email, u in users.items():
        if u.get('id') == user_id:
            u['password'] = new_hashed
            u['updated_at'] = datetime.utcnow().isoformat()
            users[email] = u
            save_users_json(users)
            return True
    
    return False
