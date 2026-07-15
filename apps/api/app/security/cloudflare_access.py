from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError

from app.config import Settings, get_settings
from app.schemas import AdminIdentity


def normalize_team_domain(value: str) -> str:
    domain = value.strip().rstrip("/")
    if domain.startswith("https://"):
        return domain
    if domain.startswith("http://"):
        raise ValueError("Cloudflare Access team domain harus memakai HTTPS")
    return f"https://{domain}"


def require_admin(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
) -> AdminIdentity:
    if not settings.cloudflare_access_team_domain or not settings.cloudflare_access_audience:
        if settings.is_production:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudflare Access belum dikonfigurasi pada server",
            )
        email = request.headers.get("X-Dev-Admin-Email")
        if email:
            return AdminIdentity(email=email, subject="local-development")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin login diperlukan",
        )

    token = request.headers.get("Cf-Access-Jwt-Assertion")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token Access tidak ada",
        )

    try:
        issuer = normalize_team_domain(settings.cloudflare_access_team_domain)
        signing_key = PyJWKClient(f"{issuer}/cdn-cgi/access/certs").get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.cloudflare_access_audience,
            issuer=issuer,
        )
    except (PyJWTError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token Cloudflare Access tidak valid",
        ) from error

    email = claims.get("email")
    subject = claims.get("sub")
    if not isinstance(email, str) or not isinstance(subject, str):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Identitas Access tidak lengkap",
        )
    return AdminIdentity(email=email, subject=subject)
