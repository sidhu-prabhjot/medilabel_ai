import pytest

from tests.factories import symptom_factory, body_metric_factory
from tests.helpers import assert_ok


@pytest.mark.xfail(
    reason=(
        "POST /symptoms returns a single dict, not a list. "
        "Fix: align backend to return list[SymptomLogResponse] and update frontend addSymptom()."
    ),
    strict=True,
)
def test_symptom_post_returns_list(test_user):
    data = assert_ok(
        test_user.client.post("/api/symptoms", json=symptom_factory()),
        expected_status=201,
    )
    assert isinstance(data, list)


@pytest.mark.xfail(
    reason=(
        "body_metrics.updated_at is always null — DB column does not exist. "
        "Fix: add the column via migration, or remove updated_at from BodyMetricResponse."
    ),
    strict=True,
)
def test_body_metric_updated_at_is_populated(test_user):
    data = assert_ok(
        test_user.client.post("/api/body-metrics", json=body_metric_factory()),
        expected_status=201,
    )
    assert data.get("updated_at") is not None
