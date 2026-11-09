from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict

from ..database import get_db
from ..dependencies import get_current_user


class FlexibleResource(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)


def to_public(document: dict | None) -> dict | None:
    if document is None:
        return None
    if "_id" in document:
        document["id"] = str(document.pop("_id"))
    return document


def parse_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid id") from exc


PUBLIC_READ_COLLECTIONS = {"community_posts", "comments"}


def make_crud_router(collection: str, prefix: str, tag: str) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag], dependencies=[Depends(get_current_user)])

    @router.get("", include_in_schema=False)
    @router.get("/")
    async def list_items(request: Request, db=Depends(get_db), user=Depends(get_current_user)):
        query: dict = {}
        if collection not in PUBLIC_READ_COLLECTIONS:
            query["owner_id"] = str(user["_id"])

        # Allow simple query param filtering (e.g. ?farm_id=... or ?plant_id=... or ?post_id=...)
        for key, value in request.query_params.items():
            if key not in ("limit", "skip", "sort", "since"):
                query[key] = value

        cursor = db[collection].find(query).sort("created_at", -1)
        items = [to_public(doc) async for doc in cursor]
        return items

    @router.get("/{item_id}")
    async def get_item(item_id: str, db=Depends(get_db), user=Depends(get_current_user)):
        query: dict = {"_id": parse_id(item_id)}
        if collection not in PUBLIC_READ_COLLECTIONS:
            query["owner_id"] = str(user["_id"])

        document = await db[collection].find_one(query)
        if document is None:
            raise HTTPException(status_code=404, detail="Not found")
        return to_public(document)

    @router.post("", status_code=201, include_in_schema=False)
    @router.post("/", status_code=201)
    async def create_item(
        payload: FlexibleResource,
        db=Depends(get_db),
        user=Depends(get_current_user),
    ):
        data = payload.model_dump(exclude_none=True)
        now = datetime.now(timezone.utc)
        data["owner_id"] = str(user["_id"])
        data["author_name"] = data.get("author_name") or user.get("name") or "Grower"
        data["created_at"] = now
        data["updated_at"] = now
        result = await db[collection].insert_one(data)
        data["id"] = str(result.inserted_id)
        data.pop("_id", None)
        return data

    @router.put("/{item_id}")
    @router.patch("/{item_id}")
    async def update_item(
        item_id: str,
        payload: FlexibleResource,
        db=Depends(get_db),
        user=Depends(get_current_user),
    ):
        data = payload.model_dump(exclude_none=True)
        data.pop("id", None)
        data.pop("_id", None)
        data.pop("owner_id", None)
        data["updated_at"] = datetime.now(timezone.utc)
        result = await db[collection].update_one(
            {"_id": parse_id(item_id), "owner_id": str(user["_id"])},
            {"$set": data},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Not found")
        document = await db[collection].find_one({"_id": parse_id(item_id)})
        return to_public(document)

    @router.delete("/{item_id}", status_code=204)
    async def delete_item(item_id: str, db=Depends(get_db), user=Depends(get_current_user)):
        result = await db[collection].delete_one(
            {"_id": parse_id(item_id), "owner_id": str(user["_id"])}
        )
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Not found")

    return router
