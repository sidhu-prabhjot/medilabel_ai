# Backend Testing

## Prerequisites

Activate the virtual environment (required — `bcrypt` and other packages live there):

```bash
# Windows
.\medical-ai-venv\Scripts\activate
```

## One-time setup

Install dev dependencies:

```bash
pip install -r requirements-dev.txt
```

Fill in `backend/.env.test` with the test Supabase project's **service role key** (not the anon key):

```
SUPABASE_KEY=<service-role-key-from-supabase-dashboard>
```

Find it at: Supabase Dashboard → Project Settings → API → `service_role` (secret).

> `.env.test` is gitignored. Never commit it.

---

## Running tests

All commands run from the `backend/` directory.

### Unit tests (no database required)

```bash
pytest tests/unit/
```

Tests JWT token logic and Pydantic schema validators. Runs in ~0.1s offline.

> `pytest.ini` sets `pythonpath = .` so the `api` package resolves from `backend/`. If you see `ModuleNotFoundError: No module named 'api'`, confirm you are running from `backend/`, not the repo root.

### All tests

```bash
pytest
```

Requires a live test database connection via `.env.test`. Integration tests hit the real Supabase test project.

### With coverage

```bash
pytest --cov=api --cov-report=term-missing
```

---

## What each test file covers

### Unit tests

| File | Tests |
|------|-------|
| `tests/unit/test_jwt.py` | Token roundtrip, expiry, tampering, refresh-as-access rejection |
| `tests/unit/test_schemas.py` | Password validator rejects weak passwords, accepts valid ones |

### Integration tests

Require a live Supabase test project via `.env.test`. Run with `pytest tests/integration/`.

| File | Tests |
|------|-------|
| `tests/integration/test_auth.py` | Signup/login set cookies, `/me` returns email, wrong password → 401, logout invalidates session |
| `tests/integration/test_symptoms.py` | Create + list happy path; IDOR: list isolation, GET/DELETE cross-user → 404 |
| `tests/integration/test_body_metrics.py` | Create + list happy path; IDOR: list isolation, GET/PUT cross-user → 404 |
| `tests/integration/test_medical.py` | Medication add; RxNav search with mock (success + 503 degradation) |
| `tests/integration/test_schedules.py` | Dose log decrements stock; IDOR: POST log cross-user → 404 |
| `tests/integration/test_plans.py` | Activating plan B deactivates plan A; IDOR: PATCH activate cross-user → 404 |
| `tests/integration/test_security.py` | All protected endpoints → 401 unauthenticated; expired/tampered/refresh tokens → 401 |
| `tests/integration/test_known_bugs.py` | `xfail(strict=True)` markers for confirmed API inconsistencies |

> **Rate limiting** is disabled when `ENVIRONMENT=test` (set in `.env.test`), so rapid fixture user creation never hits the 3/minute signup cap.
