from tests.conftest import _delete_user_records
from tests.factories import user_factory
from tests.helpers import assert_ok


def test_signup_sets_cookie(client, admin_db):
    creds = user_factory()
    resp = client.post("/api/auth/signup", json=creds)
    assert resp.status_code == 201
    assert "access_token" in resp.cookies
    user_id = client.get("/api/auth/me").json()["data"]["user_id"]
    _delete_user_records(admin_db, user_id)
    admin_db.table("users").delete().eq("id", user_id).execute()


def test_login_sets_cookie(client, admin_db):
    creds = user_factory()
    client.post("/api/auth/signup", json=creds)
    resp = client.post("/api/auth/login", json=creds)
    assert resp.status_code == 200
    assert "access_token" in resp.cookies
    user_id = client.get("/api/auth/me").json()["data"]["user_id"]
    _delete_user_records(admin_db, user_id)
    admin_db.table("users").delete().eq("id", user_id).execute()


def test_me_returns_correct_email(test_user):
    data = assert_ok(test_user.client.get("/api/auth/me"))
    assert data["email"] == test_user.email


def test_wrong_password_returns_401(test_user):
    # Login 401s use FastAPI's default {"detail":"..."} format, not the API envelope.
    resp = test_user.client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "WrongPass999!"},
    )
    assert resp.status_code == 401


def test_logout_invalidates_session(test_user):
    # Auth boundary 401s use FastAPI's default {"detail":"..."} format.
    test_user.client.post("/api/auth/logout")
    assert test_user.client.get("/api/auth/me").status_code == 401
