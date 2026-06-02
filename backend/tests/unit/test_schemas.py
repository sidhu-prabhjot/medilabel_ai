import pytest
from pydantic import ValidationError

from api.schemas.user import UserCreate


@pytest.mark.parametrize("password", [
    "Short1!",            # too short (< 12 chars)
    "alllowercase123!",   # no uppercase
    "NOLOWERCASE123!",    # no lowercase
    "NoSpecialChar123",   # no special character
])
def test_invalid_password_raises(password):
    with pytest.raises(ValidationError):
        UserCreate(email="a@b.com", password=password)


def test_valid_password_accepted():
    user = UserCreate(email="test@example.com", password="ValidPass123!")
    assert user.email == "test@example.com"
