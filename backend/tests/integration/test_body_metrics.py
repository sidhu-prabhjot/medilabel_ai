from tests.factories import body_metric_factory
from tests.helpers import assert_ok, idor_check


def test_create_and_list_body_metric(test_user):
    assert_ok(
        test_user.client.post("/api/body-metrics", json=body_metric_factory(weight_kg=75.0)),
        expected_status=201,
    )
    data = assert_ok(test_user.client.get("/api/body-metrics"))
    assert any(m["weight_kg"] == 75.0 for m in data)


def test_body_metric_idor(make_user):
    owner = make_user()
    attacker = make_user()

    metric = assert_ok(
        owner.client.post("/api/body-metrics", json=body_metric_factory()),
        expected_status=201,
    )

    # List isolation
    assert attacker.client.get("/api/body-metrics").json()["data"] == []

    # GET and PUT cross-user
    idor_check(attacker.client, "GET", f"/api/body-metrics/{metric['id']}")
    idor_check(
        attacker.client,
        "PUT",
        f"/api/body-metrics/{metric['id']}",
        body={"weight_kg": 999.0},
    )

    # Owner's value is unchanged
    original = assert_ok(owner.client.get(f"/api/body-metrics/{metric['id']}"))
    assert original["weight_kg"] == 75.0
