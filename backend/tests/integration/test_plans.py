from tests.helpers import assert_ok, idor_check


def test_activate_plan_deactivates_others(test_user):
    c = test_user.client

    plan_a = assert_ok(c.post("/api/workout-plans", json={"name": "A"}), expected_status=201)
    plan_b = assert_ok(c.post("/api/workout-plans", json={"name": "B"}), expected_status=201)

    assert_ok(c.patch(f"/api/workout-plans/{plan_a['id']}/activate"))
    assert_ok(c.patch(f"/api/workout-plans/{plan_b['id']}/activate"))

    plan_a_after = assert_ok(c.get(f"/api/workout-plans/{plan_a['id']}"))
    plan_b_after = assert_ok(c.get(f"/api/workout-plans/{plan_b['id']}"))

    assert plan_a_after["is_active"] is False
    assert plan_b_after["is_active"] is True


def test_plan_idor_activate(make_user):
    owner = make_user()
    attacker = make_user()

    plan = assert_ok(
        owner.client.post("/api/workout-plans", json={"name": "A"}), expected_status=201
    )

    idor_check(attacker.client, "PATCH", f"/api/workout-plans/{plan['id']}/activate")
