from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from backend.api.auth.hash import hash_password, verify_password
from backend.api.auth.jwt import create_access_token, decode_access_token
from backend.api.db.supabase import supabase
from backend.api.schemas.user import UserCreate, UserLogin, Token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

bearer_scheme = HTTPBearer()


# ------------------------------------------------------------------
# Signup
# ------------------------------------------------------------------

@router.post("/signup", response_model=Token, summary="Create a new user")
def signup(user: UserCreate):
    existing = supabase.table("users").select("id").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(user.password)

    response = supabase.table("users").insert({
        "email": user.email,
        "password": hashed,
    }).execute()

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user_id = response.data[0]["id"]
    token = create_access_token({"sub": str(user_id)})
    return {"access_token": token, "token_type": "bearer"}


# ------------------------------------------------------------------
# Login
# ------------------------------------------------------------------

@router.post("/login", response_model=Token, summary="Login and get JWT")
def login(user: UserLogin):
    response = supabase.table("users").select("*").eq("email", user.email).execute()

    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db_user = response.data[0]

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(db_user["id"])})
    return {"access_token": token, "token_type": "bearer"}


# ------------------------------------------------------------------
# Get current user dependency
# ------------------------------------------------------------------

def get_current_user(token: str = Depends(bearer_scheme)) -> UUID:
    try:
        payload = decode_access_token(token.credentials)
        user_id = UUID(payload.get("sub"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    response = supabase.table("users").select("id").eq("id", str(user_id)).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user_id