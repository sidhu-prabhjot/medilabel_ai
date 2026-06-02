from pydantic import BaseModel
from typing import Any


class APIEnvelope(BaseModel):
    data: Any = None
    error: str | None = None


def assert_ok(resp, expected_status: int = 200) -> Any:
    """
    Assert a success response conforming to the API envelope { data, error }.
    Returns the `data` payload for further assertions.
    Validates envelope structure — catches schema drift early.
    """
    assert resp.status_code == expected_status, (
        f"Expected {expected_status}, got {resp.status_code}: {resp.text}"
    )
    envelope = APIEnvelope.model_validate(resp.json())
    assert envelope.error is None, f"Unexpected error in {expected_status} response: {envelope.error}"
    return envelope.data


def assert_error(resp, expected_status: int) -> str:
    """
    Assert an error response conforming to the API envelope.
    Returns the error string for callers that need to inspect the message.
    """
    assert resp.status_code == expected_status, (
        f"Expected {expected_status}, got {resp.status_code}: {resp.text}"
    )
    envelope = APIEnvelope.model_validate(resp.json())
    assert envelope.error is not None, "Expected error message in response but got none"
    return envelope.error


def idor_check(attacker_client, method: str, url: str, *, body: dict = None) -> None:
    """
    Assert that a cross-user resource access returns 404 (Section 5.1 policy).
    Use this in every IDOR test — do not inline the assertion.

    Args:
        attacker_client: authenticated TestClient for the non-owning user
        method: HTTP method string ("GET", "DELETE", "PUT", "PATCH", "POST")
        url: full path including resource ID
        body: optional request body for mutation tests
    """
    resp = attacker_client.request(method, url, json=body)
    assert resp.status_code == 404, (
        f"IDOR violation: {method} {url} returned {resp.status_code}. "
        f"Expected 404 per Section 5.1. Response body: {resp.text}"
    )
