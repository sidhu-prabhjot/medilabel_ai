import uuid


def user_factory(**overrides) -> dict:
    uid = uuid.uuid4().hex[:8]
    return {"email": f"test_{uid}@test.example.com", "password": "TestPass123!", **overrides}


def symptom_factory(**overrides) -> dict:
    return {"symptom": "headache", "severity": 5, "notes": None, "is_resolved": False, **overrides}


def medication_factory(**overrides) -> dict:
    # rxcui must be unique per test run — no unique-constraint collisions across runs.
    # tty must be one of "BN", "SBD", "SCD" (backend validates this).
    rxcui = f"test_{uuid.uuid4().hex[:8]}"
    return {"rxcui": rxcui, "name": "ibuprofen", "tty": "SBD", **overrides}


def stock_factory(**overrides) -> dict:
    return {"quantity": 10.0, "unit": "tablet", **overrides}


def schedule_factory(medication_id: int, stock_id: int, **overrides) -> dict:
    return {
        "medication_id": medication_id,
        "stock_id": stock_id,
        "dose_amount": 2.0,
        "dose_unit": "tablet",
        "frequency_per_day": 1,
        "interval_hours": 24,
        "start_date": "2025-01-01",
        **overrides,
    }


def body_metric_factory(**overrides) -> dict:
    return {"weight_kg": 75.0, "body_fat_percent": 20.0, **overrides}
