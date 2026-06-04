from tests.factories import medication_factory, stock_factory, schedule_factory
from tests.helpers import assert_ok, idor_check


def test_dose_log_decrements_stock(test_user):
    c = test_user.client

    med_id = assert_ok(
        c.post("/api/medications", json=medication_factory()), expected_status=201
    )["medication_id"]

    stock_id = assert_ok(
        c.post(f"/api/medications/{med_id}/stock", json=stock_factory(quantity=10.0)),
        expected_status=201,
    )["stock_id"]

    sched_id = assert_ok(
        c.post("/api/schedules", json=schedule_factory(med_id, stock_id, dose_amount=2.0)),
        expected_status=201,
    )["schedule_id"]

    assert_ok(
        c.post(
            f"/api/schedules/{sched_id}/log",
            json={"schedule_id": sched_id, "dose_amount": 2.0, "was_missed": False},
        ),
        expected_status=201,
    )

    remaining = assert_ok(c.get(f"/api/medications/stock/{stock_id}"))["quantity"]
    assert remaining == 8.0


def test_schedule_idor_log(make_user):
    owner = make_user()
    attacker = make_user()
    c = owner.client

    med_id = assert_ok(
        c.post("/api/medications", json=medication_factory()), expected_status=201
    )["medication_id"]

    stock_id = assert_ok(
        c.post(f"/api/medications/{med_id}/stock", json=stock_factory()),
        expected_status=201,
    )["stock_id"]

    sched_id = assert_ok(
        c.post("/api/schedules", json=schedule_factory(med_id, stock_id)),
        expected_status=201,
    )["schedule_id"]

    idor_check(
        attacker.client,
        "POST",
        f"/api/schedules/{sched_id}/log",
        body={"schedule_id": sched_id, "dose_amount": 2.0, "was_missed": False},
    )
