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


@router.get("/plants")
async def list_all_plants_for_admin(admin=Depends(require_admin), db=Depends(get_db)):
    """Admin endpoint to audit and manage all grower plant records across the system."""
    cursor = db["plants"].find().sort("created_at", -1).limit(100)
    plants = []
    async for p in cursor:
        doc = dict(p)
        doc["id"] = str(doc.pop("_id"))
        doc["owner_id"] = str(doc.get("owner_id", ""))
        plants.append(doc)
    return plants


@router.get("/analytics")
async def get_system_analytics(admin=Depends(require_admin), db=Depends(get_db)):
    """Comprehensive analytics and epidemiological distribution across all scans."""
    total_scans = await db["scans"].count_documents({})
    healthy_scans = await db["scans"].count_documents({"diagnosis": "Healthy"})
    diseased_scans = total_scans - healthy_scans

    # Disease frequency distribution
    disease_counts: dict[str, int] = {}
    for disease_name in SUPPORTED_DISEASES.keys():
        if disease_name != "Healthy":
            cnt = await db["scans"].count_documents({"diagnosis": disease_name})
            disease_counts[disease_name] = cnt

    # Maturity distribution
    mature_count = await db["scans"].count_documents({"readyForHarvest": True})
    developing_count = await db["scans"].count_documents({"maturityStage": {"$regex": "Developing", "$options": "i"}})
    young_count = max(0, total_scans - mature_count - developing_count)

    return {
        "total_scans": total_scans,
        "healthy_count": healthy_scans,
        "diseased_count": diseased_scans,
        "healthy_rate_pct": round((healthy_scans / total_scans) * 100, 1) if total_scans > 0 else 0,
        "disease_distribution": disease_counts,
        "maturity_distribution": {
            "Mature / Ready for Harvest": mature_count,
            "Developing": developing_count,
            "Young / Juvenile": young_count,
        },
    }


@router.get("/activity")
async def get_system_activity_logs(admin=Depends(require_admin), db=Depends(get_db)):
    """System-wide chronological activity log."""
    logs = []

    # Recent scans
    scans_cursor = db["scans"].find().sort("createdAt", -1).limit(15)
    async for s in scans_cursor:
        logs.append({
            "id": f"scan-{str(s['_id'])}",
            "type": "scan",
            "title": f"Plant Scan: {s.get('plantName', 'Aloe Specimen')}",
            "description": f"Classification: {s.get('diagnosis', 'Healthy')} ({s.get('confidence', 0)}%)",
            "timestamp": s.get("createdAt", datetime.now(timezone.utc)).isoformat() if hasattr(s.get("createdAt"), "isoformat") else str(s.get("createdAt")),
        })

    # Recent users
    users_cursor = db["users"].find().sort("created_at", -1).limit(10)
    async for u in users_cursor:
        logs.append({
            "id": f"user-{str(u['_id'])}",
            "type": "user",
            "title": f"User Registration: {u.get('name', 'New Grower')}",
            "description": f"Email: {u.get('email', '—')} · Role: {u.get('role', 'grower')}",
            "timestamp": u.get("created_at", datetime.now(timezone.utc)).isoformat() if hasattr(u.get("created_at"), "isoformat") else str(u.get("created_at")),
        })

    logs.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
    return logs[:20]



