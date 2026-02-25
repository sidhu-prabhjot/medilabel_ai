# backend/utils/hash.py
from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _prehash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def hash_password(password: str) -> str:
    """
    Hash password using bcrypt after pre-hashing.
    """
    prehashed = _prehash_password(password)
    return pwd_context.hash(prehashed)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password by pre-hashing input before checking.
    """
    prehashed = _prehash_password(plain_password)
    return pwd_context.verify(prehashed, hashed_password)