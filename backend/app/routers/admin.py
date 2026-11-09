from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..core.vision import SUPPORTED_DISEASES
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin"])


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to access this resource.",
        )
    return user


class RoleUpdateRequest(BaseModel):
    role: str  # "admin" or "grower"


def user_to_dict(u: dict) -> dict:
    doc = dict(u)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    doc.pop("passwordHash", None)
    return doc


@router.get("/stats")
async def get_admin_stats(admin=Depends(require_admin), db=Depends(get_db)):
    """Aggregate system statistics across all collections."""
    users_count = await db["users"].count_documents({})
    farms_count = await db["farms"].count_documents({})
    plants_count = await db["plants"].count_documents({})
    diagnoses_count = await db["diagnoses"].count_documents({})
    sensors_count = await db["sensors"].count_documents({})
    maturity_count = await db["maturity"].count_documents({})
    scans_count = await db["scans"].count_documents({})
    reports_count = await db["reports"].count_documents({})

    healthy_count = await db["diagnoses"].count_documents({"diagnosis": "Healthy"})
    disease_rate = (
        round(((diagnoses_count - healthy_count) / diagnoses_count) * 100, 1)
        if diagnoses_count > 0
        else 0
    )

    # Calculate total revenue and profit across all reports
    reports = await db["reports"].find().to_list(100)
    total_rev = sum(float(r.get("revenue") or 0) for r in reports)
    total_profit = sum(float(r.get("net_profit") or 0) for r in reports)

    return {
        "users": users_count,
        "farms": farms_count,
        "plants": plants_count,
        "diagnoses": diagnoses_count,
        "sensors": sensors_count,
        "maturity": maturity_count,
        "scans": scans_count,
        "reports": reports_count,
        "healthy_diagnoses": healthy_count,
        "disease_rate_pct": disease_rate,
        "total_revenue": total_rev,
        "total_profit": total_profit,
        "model_status": "Online (Active Vision & Foliar Analyzer)",
    }


@router.get("/users")
async def list_all_users(admin=Depends(require_admin), db=Depends(get_db)):
    """List all registered users with their roles and creation dates."""
    cursor = db["users"].find().sort("created_at", -1)
    users = []
    async for u in cursor:
        d = user_to_dict(u)
        uid = str(u["_id"])
        d["plants_count"] = await db["plants"].count_documents({"owner_id": uid})
        d["scans_count"] = await db["scans"].count_documents({"owner_id": uid})
        users.append(d)
    return users


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: RoleUpdateRequest,
    admin=Depends(require_admin),
    db=Depends(get_db),
):
    """Change a user's role between 'grower' and 'admin'."""
    if payload.role not in ("admin", "grower"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'grower'.")

    query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
    res = await db["users"].update_one(query, {"$set": {"role": payload.role, "updated_at": datetime.now(timezone.utc)}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    updated = await db["users"].find_one(query)
    return user_to_dict(updated)


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin=Depends(require_admin),
    db=Depends(get_db),
):
    """Admin endpoint to remove a user account."""
    if str(admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")
    query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
    res = await db["users"].delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": f"User {user_id} deleted."}


@router.get("/scans")
async def list_all_scans(admin=Depends(require_admin), db=Depends(get_db)):
    """Admin audit feed of all plant scans across all growers."""
    cursor = db["scans"].find().sort("createdAt", -1).limit(100)
    scans = []
    async for s in cursor:
        doc = dict(s)
        doc["id"] = str(doc.pop("_id"))
        if "userId" in doc:
            doc["userId"] = str(doc["userId"])
        scans.append(doc)
    return scans


@router.delete("/scans/{scan_id}")
async def delete_scan_record(
    scan_id: str,
    admin=Depends(require_admin),
    db=Depends(get_db),
):
    """Admin endpoint to delete an erroneous or invalid scan record."""
    query = {"_id": ObjectId(scan_id)} if ObjectId.is_valid(scan_id) else {"_id": scan_id}
    res = await db["scans"].delete_one(query)
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan record not found")
    return {"success": True, "message": f"Scan {scan_id} deleted."}


@router.get("/diseases")
async def get_disease_catalog(admin=Depends(require_admin), db=Depends(get_db)):
    """Returns the full disease library merged with any admin customizations from DB."""
    catalog = dict(SUPPORTED_DISEASES)
    cursor = db["diseases"].find()
    async for doc in cursor:
        key = doc.get("key") or doc.get("name")
        if key:
            d = dict(doc)
            d.pop("_id", None)
            catalog[key] = {**catalog.get(key, {}), **d}
    return catalog


@router.put("/diseases/{disease_key}")
async def update_disease_treatment(
    disease_key: str,
    payload: dict,
    admin=Depends(require_admin),
    db=Depends(get_db),
):
    """
    Admin endpoint to update disease descriptions, symptoms, treatments, and prevention protocols.
    Synchronizes immediately with user-facing care guides, vision diagnoses, and scan results.
    """
    doc = dict(payload)
    doc["key"] = disease_key
    doc["updated_at"] = datetime.now(timezone.utc)
    doc["updated_by"] = str(admin["_id"])

    await db["diseases"].update_one(
        {"key": disease_key},
        {"$set": doc},
        upsert=True,
    )

    updated = await db["diseases"].find_one({"key": disease_key})
    if updated and "_id" in updated:
        updated["id"] = str(updated.pop("_id"))
    return {"success": True, "disease": updated}


