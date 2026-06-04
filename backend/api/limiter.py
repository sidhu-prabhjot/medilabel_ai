import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# Rate limiting is disabled in the test environment so fixture user creation
# (signup × N per test run) never hits the 3/minute signup cap.
_enabled = os.getenv("ENVIRONMENT") != "test"
limiter = Limiter(key_func=get_remote_address, enabled=_enabled)