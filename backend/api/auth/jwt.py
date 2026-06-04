# backend/utils/jwt.py
from datetime import datetime, timedelta, timezone
import jwt
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not set in environment variables")

# Use a secret key! In production, load from env vars
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
if ALGORITHM not in ("HS256", "HS384", "HS512"):
    raise RuntimeError(f"Unsupported JWT_ALGORITHM: '{ALGORITHM}'. Must be HS256, HS384, or HS512")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    # jti (JWT ID) ensures uniqueness even when multiple tokens are issued for the
    # same user within the same second — prevents unique constraint violations on storage.
    to_encode.update({"exp": expire, "type": "refresh", "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("type") == "refresh":
        raise jwt.InvalidTokenError("Refresh token cannot be used as access token")
    return payload
