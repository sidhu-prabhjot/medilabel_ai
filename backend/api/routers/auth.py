from fastapi import APIRouter, HTTPException

from api.auth.hash import hash_password, verify_password
from api.auth.jwt import create_access_token
from api.db.supabase import supabase
from api.schemas.user import UserCreate, UserLogin, Token
from postgrest.exceptions import APIError as PostgrestAPIError

#rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ------------------------------------------------------------------
# Signup
# ------------------------------------------------------------------

@router.post("/signup", response_model=Token, summary="Create a new user")
@limiter.limit("3/minute")
def signup(request:Request, user: UserCreate):
    hashed = hash_password(user.password)

    try:
        response = supabase.table("users").insert({
            "email": user.email,
            "password": hashed,
        }).execute()
    except PostgrestAPIError as e:
        if "23505" in str(e): #unique violation
            raise HTTPException(status_code=400, detail="Email already registered")
        raise

    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user_id = response.data[0]["id"]
    token = create_access_token({"sub": str(user_id)})
    return {"access_token": token, "token_type": "bearer"}


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

    token = create_access_token({"sub": str(db_user["id"])})
    return {"access_token": token, "token_type": "bearer"}
