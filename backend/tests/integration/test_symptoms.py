from tests.factories import symptom_factory
from tests.helpers import assert_ok, idor_check


def test_create_and_list_symptom(test_user):
    assert_ok(
        test_user.client.post("/api/symptoms", json=symptom_factory(symptom="nausea")),
        expected_status=201,
    )
    data = assert_ok(test_user.client.get("/api/symptoms"))
    assert any(s["symptom"] == "nausea" for s in data)


def test_symptom_idor(make_user):
    owner = make_user()
    attacker = make_user()

    sym = assert_ok(
        owner.client.post("/api/symptoms", json=symptom_factory()),
        expected_status=201,
    )

    # List isolation — attacker sees no rows
    assert attacker.client.get("/api/symptoms").json()["data"] == []

    # GET and DELETE cross-user
    idor_check(attacker.client, "GET", f"/api/symptoms/{sym['symptom_id']}")
    idor_check(attacker.client, "DELETE", f"/api/symptoms/{sym['symptom_id']}")

    # Owner's record is unchanged
    assert len(assert_ok(owner.client.get("/api/symptoms"))) == 1
