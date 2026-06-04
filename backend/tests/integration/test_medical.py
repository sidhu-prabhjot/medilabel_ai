from unittest.mock import AsyncMock, MagicMock, patch

import httpx

from tests.factories import medication_factory
from tests.helpers import assert_ok


def _make_async_client(side_effects: list) -> tuple:
    """Return (MockClass, mock_client) ready for use in `with patch(...) as MockClass`."""
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=side_effects)
    return mock_client


def test_medication_search_returns_results(test_user):
    # Patch only httpx.AsyncClient inside the medical router so Supabase's
    # sync httpx.Client calls are unaffected and auth continues to work.
    id_resp = MagicMock()
    id_resp.json.return_value = {"idGroup": {"rxnormId": ["99999999"]}}
    id_resp.raise_for_status.return_value = None

    props_resp = MagicMock()
    props_resp.json.return_value = {
        "properties": {"rxcui": "99999999", "name": "test_drug", "tty": "SBD"}
    }
    props_resp.raise_for_status.return_value = None

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(side_effect=[id_resp, props_resp])

    with patch("api.routers.medical.httpx.AsyncClient") as MockClass:
        MockClass.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        MockClass.return_value.__aexit__ = AsyncMock(return_value=None)
        resp = test_user.client.get("/api/medications/search?medication_term=ibuprofen")

    data = assert_ok(resp)
    assert isinstance(data, list)
    assert len(data) > 0


def test_medication_search_degrades_on_rxnav_503(test_user):
    id_resp = MagicMock()
    id_resp.raise_for_status.side_effect = httpx.HTTPStatusError(
        "503 Service Unavailable",
        request=MagicMock(),
        response=MagicMock(status_code=503),
    )

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=id_resp)

    with patch("api.routers.medical.httpx.AsyncClient") as MockClass:
        MockClass.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        MockClass.return_value.__aexit__ = AsyncMock(return_value=None)
        resp = test_user.client.get("/api/medications/search?medication_term=ibuprofen")

    assert resp.status_code != 500


def test_add_medication_happy_path(test_user):
    payload = medication_factory()
    data = assert_ok(
        test_user.client.post("/api/medications", json=payload),
        expected_status=201,
    )
    assert "medication_id" in data
    assert data["name"] == payload["name"]
