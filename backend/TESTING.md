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

| File | Tests |
|------|-------|
| `tests/unit/test_jwt.py` | Token roundtrip, expiry, tampering, refresh-as-access rejection |
| `tests/unit/test_schemas.py` | Password validator rejects weak passwords, accepts valid ones |

Integration tests (`tests/integration/`) are added in Phase 2 and require the test database.
