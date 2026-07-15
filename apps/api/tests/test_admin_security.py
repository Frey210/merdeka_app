from unittest.mock import Mock

import pytest
from fastapi import HTTPException

from app.config import Settings
from app.security.cloudflare_access import normalize_team_domain, require_admin


def test_normalize_cloudflare_team_domain() -> None:
    assert normalize_team_domain("my-team.cloudflareaccess.com/") == (
        "https://my-team.cloudflareaccess.com"
    )


def test_production_admin_fails_closed_without_access_configuration() -> None:
    request = Mock(headers={})
    settings = Settings(
        app_env="production",
        cloudflare_access_team_domain="",
        cloudflare_access_audience="",
    )

    with pytest.raises(HTTPException) as caught:
        require_admin(request, settings)

    assert caught.value.status_code == 503


def test_local_admin_requires_explicit_development_header() -> None:
    request = Mock(headers={"X-Dev-Admin-Email": "admin@example.test"})
    identity = require_admin(request, Settings(app_env="development"))

    assert identity.email == "admin@example.test"
    assert identity.subject == "local-development"
