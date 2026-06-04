# Covers auth boundaries (Section 5.2) and token integrity (Section 5.3).
# IDOR tests live in each router's domain test file per Section 7.
import pytest

from api.auth.jwt import create_access_token, create_refresh_token
from datetime import timedelta


# --- Auth boundaries (Section 5.2) ---

@pytest.mark.parametrize("method,path", [
    ("GET",  "/api/auth/me"),
    ("GET",  "/api/symptoms"),
    ("POST", "/api/symptoms"),
    ("GET",  "/api/user/medications"),
    ("GET",  "/api/body-metrics"),
    ("GET",  "/api/schedules"),
    ("GET",  "/api/workout-plans"),
    ("GET",  "/api/workouts"),
])
def test_unauthenticated_request_returns_401(client, method, path):
    resp = client.request(method, path)
    assert resp.status_code == 401


# --- Token integrity (Section 5.3) ---

def test_expired_token_returns_401(client):
    expired = create_access_token({"sub": "some-id"}, expires_delta=timedelta(seconds=-1))
    resp = client.get("/api/auth/me", cookies={"access_token": expired})
    assert resp.status_code == 401


def test_tampered_token_returns_401(client):
    valid = create_access_token({"sub": "some-id"})
    resp = client.get("/api/auth/me", cookies={"access_token": valid[:-6] + "XXXXXX"})
    assert resp.status_code == 401


def test_refresh_token_cannot_be_used_as_access_token(client):
    refresh = create_refresh_token({"sub": "some-id"})
    resp = client.get("/api/auth/me", cookies={"access_token": refresh})
    assert resp.status_code == 401
