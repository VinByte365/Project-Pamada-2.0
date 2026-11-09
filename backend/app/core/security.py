import logging

import jwt
from fastapi import HTTPException
from jwt import PyJWKClient

from ..config import settings

logger = logging.getLogger("farmsystem.auth")

_jwks_client: PyJWKClient | None = None


def get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        if not settings.supabase_url:
            raise HTTPException(status_code=503, detail="Supabase URL is not configured")
        jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_client


async def verify_supabase_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as exc:
        logger.warning("Supabase JWT verification failed: invalid token header (%s)", exc)
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    algorithm = header.get("alg")
    issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1" if settings.supabase_url else None

    try:
        if algorithm == "HS256":
            if not settings.supabase_jwt_secret:
                logger.error("Supabase JWT secret is not configured")
                raise HTTPException(status_code=503, detail="Supabase JWT secret is not configured")
            key = settings.supabase_jwt_secret
            algorithms = ["HS256"]
        else:
            jwks_client = get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            key = signing_key.key
            algorithms = [algorithm] if algorithm else ["ES256", "RS256"]

        payload = jwt.decode(
            token,
            key,
            algorithms=algorithms,
            audience="authenticated",
            issuer=issuer,
            leeway=300,
            options={"verify_aud": True, "verify_iss": bool(issuer)},
        )
    except jwt.ExpiredSignatureError as exc:
        logger.warning("Supabase JWT verification failed: token expired")
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        logger.warning("Supabase JWT verification failed: invalid token (%s)", exc)
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    except Exception as exc:
        logger.exception("Supabase JWT verification failed unexpectedly")
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    if not payload.get("sub"):
        logger.warning("Supabase JWT verification failed: missing subject")
        raise HTTPException(status_code=401, detail="Invalid token subject")

    logger.info("Supabase JWT verified for subject=%s using %s", payload.get("sub"), algorithm)
    return payload
