from datetime import timedelta

import jwt
import pytest

from api.auth.jwt import create_access_token, create_refresh_token, decode_access_token


def test_token_roundtrip():
    token = create_access_token({"sub": "user-123"})
    assert decode_access_token(token)["sub"] == "user-123"


def test_expired_token_raises():
    token = create_access_token({"sub": "x"}, expires_delta=timedelta(seconds=-1))
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)


def test_tampered_token_raises():
    token = create_access_token({"sub": "x"})
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token[:-4] + "XXXX")


def test_refresh_token_rejected_as_access_token():
    token = create_refresh_token({"sub": "x"})
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)
