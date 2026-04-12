from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response
import os

from api.auth.hash import hash_password, verify_password
from api.auth.jwt import create_access_token, create_refresh_token, decode_access_token, REFRESH_TOKEN_EXPIRE_DAYS, ACCESS_TOKEN_EXPIRE_MINUTES
from api.db.supabase import supabase
from api.auth.auth import get_current_user
from api.schemas.user import UserCreate, UserLogin, MeResponse
from postgrest.exceptions import APIError as PostgrestAPIError

#rate limiting
from api.limiter import limiter

router = APIRouter(prefix="/api/auth", tags=["Auth"])

IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _set_auth_cookies(response:Response, user_id: str) -> None:
    """Create access + refresh tokens and store the refresh token in the DB."""
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})

    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    supabase.table("refresh_tokens").insert({
        "user_id": user_id,
        "token": refresh_token,
        "expires_at": expires_at.isoformat(),
    }).execute()

    #short-lived
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax", # need to update this for prod
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    #long-lived
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax", # need to update this for prod
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/auth/refresh"
    )


# ------------------------------------------------------------------
# Signup
# ------------------------------------------------------------------

@router.post("/signup", summary="Create a new user", status_code=201)
@limiter.limit("3/minute")
def signup(request: Request, response: Response, user: UserCreate):
    hashed = hash_password(user.password)

    try:
        db_response = supabase.table("users").insert({
            "email": user.email,
            "password": hashed,
        }).execute()
    except PostgrestAPIError as e:
        if "23505" in str(e):
            raise HTTPException(status_code=400, detail="Email already registered")
        raise

    if not db_response.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user_id = db_response.data[0]["id"]
    
    _set_auth_cookies(response, str(user_id))

    return {"message": "Account created"}


# ------------------------------------------------------------------
# Login
# ------------------------------------------------------------------

@router.post("/login", summary="Login and get JWT")
@limiter.limit("5/minute")
def login(request: Request, response: Response, user: UserLogin):
    db_response = supabase.table("users").select("*").eq("email", user.email).execute()

    if not db_response.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db_user = db_response.data[0]

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    _set_auth_cookies(response, str(db_user["id"]))

    return {"message": "Login successful"}


# ------------------------------------------------------------------
# Refresh
# ------------------------------------------------------------------

@router.post("/refresh", summary="Refresh access token")
@limiter.limit("30/minute")
def refresh(request: Request, response: Response):
    # 1. decode and validate the token
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = decode_access_token(refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    # 2. confirm it's a refresh token, not an access token
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    # 3. check it exists in the DB (not already rotated/revoked)
    result = supabase.table("refresh_tokens").select("id").eq("token", refresh_token).execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="Refresh token revoked or not found")

    user_id = payload.get("sub")

    # 4. rotate — delete old token then issue new pair
    supabase.table("refresh_tokens").delete().eq("token", refresh_token).execute()

    _set_auth_cookies(response, user_id)

# ------------------------------------------------------------------
# Me
# ------------------------------------------------------------------

@router.get("/me", response_model=MeResponse, summary="Get current user")
def me(current_user_id=Depends(get_current_user)):
    result = supabase.table("users").select("email").eq("id", str(current_user_id)).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return MeResponse(email=result.data[0]["email"])


# ------------------------------------------------------------------
# Logout
# ------------------------------------------------------------------

@router.post("/logout", status_code=200, summary="Logout")
def logout(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        supabase.table("refresh_tokens").delete().eq("token", refresh_token).execute()
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}