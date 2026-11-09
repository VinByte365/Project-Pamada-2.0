from datetime import datetime, timedelta, timezone
import logging

import jwt
from fastapi import HTTPException

from ..config import settings

logger = logging.getLogger("farmsystem.auth")


def get_jwt_secret() -> str:
    secret = settings.supabase_jwt_secret or settings.secret_key
    return secret


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=7)
    to_encode.update({"iat": now, "exp": expire})
    if "aud" not in to_encode:
        to_encode["aud"] = "authenticated"
    secret = get_jwt_secret()
    return jwt.encode(to_encode, secret, algorithm="HS256")


async def verify_supabase_token(token: str) -> dict:
    secret = get_jwt_secret()
    if not secret or secret == "change-me":
        logger.error("JWT secret is not configured")
        raise HTTPException(status_code=503, detail="JWT secret is not configured")

    issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1" if settings.supabase_url else None
    options = {"verify_aud": True, "verify_iss": bool(issuer)}

    logger.debug("Verifying JWT; issuer=%s", issuer)

    try:
        try:
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
                issuer=issuer,
                options=options,
            )
        except jwt.InvalidAudienceError:
            # Fallback for tokens issued without explicit 'authenticated' audience
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                issuer=issuer,
                options={**options, "verify_aud": False},
            )
    except jwt.ExpiredSignatureError as exc:
        logger.warning("JWT verification failed: token expired")
        raise HTTPException(status_code=401, detail="Token expired") from exc
    except jwt.InvalidTokenError as exc:
        logger.warning("JWT verification failed: invalid token (%s)", exc)
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    if not payload.get("sub"):
        logger.warning("JWT verification failed: missing subject")
        raise HTTPException(status_code=401, detail="Invalid token subject")

    logger.info("JWT verified for subject=%s", payload.get("sub"))
    return payload
