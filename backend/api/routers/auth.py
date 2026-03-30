from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request

from api.auth.hash import hash_password, verify_password
from api.auth.jwt import create_access_token, create_refresh_token, decode_access_token, REFRESH_TOKEN_EXPIRE_DAYS
from api.db.supabase import supabase
from api.schemas.user import UserCreate, UserLogin, Token, RefreshRequest
from postgrest.exceptions import APIError as PostgrestAPIError

#rate limiting
from api.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _issue_tokens(user_id: str) -> dict:
    """Create access + refresh tokens and store the refresh token in the DB."""
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})

    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    supabase.table("refresh_tokens").insert({
        "user_id": user_id,
        "token": refresh_token,
        "expires_at": expires_at.isoformat(),
    }).execute()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


# ------------------------------------------------------------------
# Signup
# ------------------------------------------------------------------

@router.post("/signup", response_model=Token, summary="Create a new user", status_code=201)
@limiter.limit("3/minute")
def signup(request: Request, user: UserCreate):
    hashed = hash_password(user.password)

    try:
        response = supabase.table("users").insert({
            "email": user.email,
            "password": hashed,
        }).execute()
    except PostgrestAPIError as e:
        if "23505" in str(e):
            raise HTTPException(status_code=400, detail="Email already registered")
        raise

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user_id = response.data[0]["id"]
    return _issue_tokens(str(user_id))


# ------------------------------------------------------------------
# Login
# ------------------------------------------------------------------

@router.post("/login", response_model=Token, summary="Login and get JWT")
@limiter.limit("10/hour")
def login(request: Request, user: UserLogin):
    response = supabase.table("users").select("*").eq("email", user.email).execute()

    if not response.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db_user = response.data[0]

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return _issue_tokens(str(db_user["id"]))


# ------------------------------------------------------------------
# Refresh
# ------------------------------------------------------------------

@router.post("/refresh", response_model=Token, summary="Refresh access token")
@limiter.limit("30/minute")
def refresh(request: Request, body: RefreshRequest):
    # 1. decode and validate the token
    try:
        payload = decode_access_token(body.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # 2. confirm it's a refresh token, not an access token
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    # 3. check it exists in the DB (not already rotated/revoked)
    result = supabase.table("refresh_tokens").select("id").eq("token", body.refresh_token).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Refresh token revoked or not found")

    user_id = payload.get("sub")

    # 4. rotate — delete old token then issue new pair
    supabase.table("refresh_tokens").delete().eq("token", body.refresh_token).execute()

    return _issue_tokens(user_id)
