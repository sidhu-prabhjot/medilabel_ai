# backend/utils/hash.py
import bcrypt

def hash_password(password: str) -> str:
    """
    Don't do prehashing to avoid truncating output possibility space
    """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))