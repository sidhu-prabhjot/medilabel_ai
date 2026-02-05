from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from uuid import UUID
from backend.api.db.supabase import supabase

security = HTTPBearer()

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UUID:
    provider_user_id = credentials.credentials  # token string

    result = supabase.table("users") \
        .select("id") \
        .eq("auth_provider", "firebase") \
        .eq("auth_provider_user_id", provider_user_id) \
        .execute()

    if not result.data:
        raise HTTPException(status_code=401, detail="User not found")
    
    print(result)

    return UUID(result.data[0]["id"])
