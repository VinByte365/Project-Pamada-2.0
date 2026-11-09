from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/sync", tags=["Sync"])


@router.post("/upload")
async def upload(records: list[dict], user=Depends(get_current_user), db=Depends(get_db)):
    """Idempotent upload skeleton. Records should include collection, local_id, and payload."""
    results = []
    for record in records:
        collection = record.get("collection")
        local_id = record.get("local_id")
        payload = record.get("payload") or {}
        if not collection or not local_id:
            results.append({"local_id": local_id, "status": "skipped"})
            continue

        now = datetime.now(timezone.utc)
        payload = dict(payload)
        payload.pop("_id", None)
        payload.pop("id", None)
        payload["owner_id"] = str(user["_id"])
        payload["local_id"] = local_id
        payload["updated_at"] = now
        payload.setdefault("version", 1)

        existing = await db[collection].find_one(
            {"owner_id": str(user["_id"]), "local_id": local_id}
        )
        if existing is None:
            payload["created_at"] = now
            result = await db[collection].insert_one(payload)
            results.append({"local_id": local_id, "status": "created", "server_id": str(result.inserted_id)})
        else:
            payload["version"] = int(existing.get("version", 1)) + 1
            await db[collection].update_one(
                {"_id": existing["_id"]},
                {"$set": payload},
            )
            results.append({"local_id": local_id, "status": "updated", "server_id": str(existing["_id"])})

    return {"results": results}


@router.get("/download")
async def download(since: str | None = None, user=Depends(get_current_user), db=Depends(get_db)):
    """Download skeleton returning user-owned records updated after `since`."""
    query: dict = {"owner_id": str(user["_id"])}
    if since:
        try:
            query["updated_at"] = {"$gt": datetime.fromisoformat(since)}
        except ValueError:
            pass

    collections = [
        "farms",
        "plants",
        "diagnoses",
        "maturity_assessments",
        "gradings",
        "sensor_readings",
        "profit_reports",
        "community_posts",
        "comments",
    ]
    data: dict[str, list] = {}
    for collection in collections:
        cursor = db[collection].find(query)
        items = []
        async for doc in cursor:
            if "_id" in doc:
                doc["id"] = str(doc.pop("_id"))
            items.append(doc)
        data[collection] = items
    return {"since": since, "data": data}
