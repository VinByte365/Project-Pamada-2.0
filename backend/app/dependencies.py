import logging
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings
from .database import get_db

logger = logging.getLogger("farmsystem.auth")

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db=Depends(get_db),
) -> dict:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    from .core.security import verify_supabase_token

    payload = await verify_supabase_token(credentials.credentials)
    supabase_id = payload.get("sub")
    if not supabase_id:
        raise HTTPException(status_code=401, detail="Invalid token subject")

    user = None
    email = (payload.get("email") or "").strip().lower()
    query_parts: list[dict] = []
    if ObjectId.is_valid(supabase_id):
        query_parts.append({"_id": ObjectId(supabase_id)})
    query_parts.append({"supabase_id": supabase_id})
    if email:
        query_parts.append({"email": email})

    user = await db["users"].find_one({"$or": query_parts})

    if user is None:
        now = datetime.now(timezone.utc)
        meta = payload.get("user_metadata") or {}
        name = meta.get("name") or payload.get("name") or "User"
        email = payload.get("email") or ""
        role = payload.get("role") or "grower"
        document = {
            "supabase_id": supabase_id,
            "email": email,
            "name": name,
            "role": role,
            "created_at": now,
            "updated_at": now,
        }
        result = await db["users"].insert_one(document)
        document["_id"] = result.inserted_id
        user = document
        logger.info("Created MongoDB user for subject=%s", supabase_id)
    else:
        logger.info("Found existing MongoDB user for subject=%s", supabase_id)

    return user
