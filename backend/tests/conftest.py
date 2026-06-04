from contextlib import ExitStack
from dataclasses import dataclass
import os

import pytest
from fastapi.testclient import TestClient
from supabase import create_client
from postgrest.exceptions import APIError as PostgrestAPIError

from api.main import app
from tests.factories import user_factory


@dataclass
class TestUser:
    client: TestClient
    email: str
    password: str
    user_id: str


def _delete_user_records(admin_db, user_id: str) -> None:
    """
    Explicit reverse-dependency deletion. Runs before the users row is deleted.
    Works even if FK cascade constraints are absent or misconfigured.
    Add new tables here as the schema grows — keep in reverse FK dependency order.
    """
    child_tables = [
        "user_medication_intake_logs",
        "user_medication_schedule",
        "user_medication_history",
        "workout_sets",
        "workout_exercises",
        "workout_sessions",
        "workout_plan_routines",
        "workout_plans",
        "user_medication_stock",
        "user_medications",
        "body_metrics",
        "symptom_logs",
        "refresh_tokens",
    ]
    for table in child_tables:
        try:
            admin_db.table(table).delete().eq("user_id", user_id).execute()
        except PostgrestAPIError as exc:
            # PGRST205 = table not found in schema cache.
            # 42703   = column not found (e.g. workout_exercises has no user_id —
            #           those rows are cleaned up transitively via the session FK).
            if exc.code not in ("PGRST205", "42703"):
                raise


@pytest.fixture(scope="session")
def admin_db():
    """Service-role client — bypasses RLS. For DB cleanup only. MUST NOT be passed to application code."""
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])


@pytest.fixture
def client():
    """Unauthenticated per-test client. Use for auth boundary and signup tests."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def make_user(admin_db):
    """
    Fixture factory for creating isolated test users.

    Call make_user() once per user needed. Each call returns a TestUser with
    its own cookie jar (separate TestClient). Teardown — explicit child deletion,
    user row deletion, client shutdown — runs automatically even on test failure.

    Single-user:
        def test_example(make_user):
            user = make_user()
            user.client.get("/api/symptoms")

    IDOR — no try/finally required:
        def test_idor(make_user):
            owner    = make_user()
            attacker = make_user()
    """
    stack = ExitStack()
    created: list[TestUser] = []

    def _factory() -> TestUser:
        c = stack.enter_context(TestClient(app))
        creds = user_factory()
        signup_resp = c.post("/api/auth/signup", json=creds)
        assert signup_resp.status_code in (200, 201), f"Signup failed: {signup_resp.text}"
        login_resp = c.post("/api/auth/login", json=creds)
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        user_id = c.get("/api/auth/me").json()["data"]["user_id"]
        user = TestUser(
            client=c,
            email=creds["email"],
            password=creds["password"],
            user_id=user_id,
        )
        created.append(user)
        return user

    yield _factory

    for user in created:
        _delete_user_records(admin_db, user.user_id)
        admin_db.table("users").delete().eq("id", user.user_id).execute()
    stack.close()


@pytest.fixture
def test_user(make_user) -> TestUser:
    """Convenience fixture for single-user tests. Equivalent to calling make_user() once."""
    return make_user()
