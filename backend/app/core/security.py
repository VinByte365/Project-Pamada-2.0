import logging

import jwt
from fastapi import HTTPException

from ..config import settings

logger = logging.getLogger("farmsystem.auth")


async def verify_supabase_token(token: str) -> dict:
    if not settings.supabase_jwt_secret:
        logger.error("Supabase JWT secret is not configured")
        raise HTTPException(status_code=503, detail="Supabase JWT secret is not configured")

    issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1" if settings.supabase_url else None
    options = {"verify_aud": True, "verify_iss": bool(issuer)}

    logger.debug("Verifying Supabase JWT; issuer=%s", issuer)

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=issuer,
            options=options,
        )
    except jwt.ExpiredSignatureError as exc:
        logger.warning("Supabase JWT verification failed: token expired")
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        logger.warning("Supabase JWT verification failed: invalid token (%s)", exc)
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    if not payload.get("sub"):
        logger.warning("Supabase JWT verification failed: missing subject")
        raise HTTPException(status_code=401, detail="Invalid token subject")

    logger.info("Supabase JWT verified for subject=%s", payload.get("sub"))
    return payload
