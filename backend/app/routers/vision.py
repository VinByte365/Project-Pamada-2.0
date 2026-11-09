from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from ..core.vision import (
    SUPPORTED_DISEASES,
    analyze_aloe_characteristics,
    decode_image_bytes,
)
from ..database import get_db
from ..dependencies import get_current_user

router = APIRouter(prefix="/vision", tags=["Vision AI"])


class Base64AnalyzeRequest(BaseModel):
    image_base64: str
    plant_id: str | None = None
    plant_name: str | None = None
    farm_id: str | None = None


@router.get("/diseases")
async def list_diseases():
    """Returns the full catalog of supported Aloe Vera diseases and treatments."""
    return {
        "count": len(SUPPORTED_DISEASES),
        "diseases": SUPPORTED_DISEASES,
    }


@router.get("/status")
async def vision_status():
    """Returns status and diagnostic capabilities of the Aloe Vera Vision AI engine."""
    return {
        "status": "online",
        "engine": "AloeGuard Botanical Vision & Foliar Chromatic Analyzer",
        "supported_formats": ["JPEG", "PNG", "WebP"],
        "max_file_size_mb": 10,
        "species_supported": ["Aloe barbadensis Miller"],
        "supported_diseases_count": len(SUPPORTED_DISEASES),
        "supported_diseases": list(SUPPORTED_DISEASES.keys()),
        "maturity_stages": [
            "Young / Not Yet Mature",
            "Developing",
            "Mature / Potentially Ready for Harvest",
        ],
    }


@router.post("/analyze")
async def analyze_plant_image(
    payload: Base64AnalyzeRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Main vision analysis endpoint:
    1. Decodes and checks image.
    2. Validates whether the image is an Aloe Vera plant.
    3. Rejects non-Aloe Vera images with an understandable message (HTTP 422).
    4. Evaluates disease pathology and harvest maturity.
    5. Persists the record to `diagnoses`, `maturity`, and `scans` in MongoDB.
    """
    try:
        img = decode_image_bytes(payload.image_base64)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format: {exc}",
        ) from exc

    analysis = analyze_aloe_characteristics(img)
    species = analysis["species_identification"]

    # Reject non-Aloe Vera plants according to Phase 5 requirements
    if not species["is_aloe_vera"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Species Rejection",
                "message": species["rejection_reason"],
                "is_aloe_vera": False,
                "confidence": species["confidence"],
                "suggestion": "Please photograph an Aloe Vera plant (Aloe barbadensis) in clear natural light.",
            },
        )

    # If verified Aloe Vera, persist results to database
    now = datetime.now(timezone.utc)
    user_id = str(user["_id"])
    plant_name = (payload.plant_name or "").strip() or f"Aloe Specimen #{str(now.timestamp())[-4:]}"
    plant_id = payload.plant_id

    # If plant does not exist, automatically register a new plant record
    if not plant_id:
        plant_doc = {
            "name": plant_name,
            "variety": "Aloe barbadensis Miller",
            "farm_id": payload.farm_id,
            "stage": analysis["harvest_maturity"]["stage"].split(" /")[0],
            "health_status": analysis["disease_detection"]["disease"],
            "image_url": payload.image_base64[:140000],  # truncated thumbnail representation
            "notes": "Verified Aloe Vera visual scan intake.",
            "owner_id": user_id,
            "created_at": now,
            "updated_at": now,
        }
        res = await db["plants"].insert_one(plant_doc)
        plant_id = str(res.inserted_id)
    else:
        # Update plant health status
        await db["plants"].update_one(
            {"_id": ObjectId(plant_id) if ObjectId.is_valid(plant_id) else plant_id},
            {
                "$set": {
                    "health_status": analysis["disease_detection"]["disease"],
                    "stage": analysis["harvest_maturity"]["stage"].split(" /")[0],
                    "updated_at": now,
                }
            },
        )

    # Save diagnosis record
    diag_doc = {
        "plant_id": plant_id,
        "plant_name": plant_name,
        "diagnosis": analysis["disease_detection"]["disease"],
        "severity": analysis["disease_detection"]["severity"],
        "confidence": analysis["disease_detection"]["confidence"],
        "symptoms": "; ".join(analysis["disease_detection"]["symptoms_observed"]),
        "recommendations": analysis["disease_detection"]["treatments"],
        "image_url": payload.image_base64[:140000],
        "owner_id": user_id,
        "created_at": now,
        "updated_at": now,
    }
    diag_res = await db["diagnoses"].insert_one(diag_doc)
    diag_id = str(diag_res.inserted_id)

    # Save maturity record
    mat_doc = {
        "plant_id": plant_id,
        "plant_name": plant_name,
        "stage": analysis["harvest_maturity"]["stage"],
        "maturity_index": analysis["harvest_maturity"]["maturity_index"],
        "leaf_count": analysis["harvest_maturity"]["estimated_leaf_count"],
        "leaf_thickness_mm": analysis["harvest_maturity"]["estimated_leaf_thickness_mm"],
        "ready_for_harvest": analysis["harvest_maturity"]["ready_for_harvest"],
        "notes": analysis["harvest_maturity"]["harvest_guidance"],
        "owner_id": user_id,
        "created_at": now,
        "updated_at": now,
    }
    mat_res = await db["maturity"].insert_one(mat_doc)
    mat_id = str(mat_res.inserted_id)

    # Save to unified scans collection for search history
    scan_doc = {
        "userId": user["_id"],
        "owner_id": user_id,
        "plantId": plant_id,
        "plantName": plant_name,
        "diagnosis": analysis["disease_detection"]["disease"],
        "diseaseName": analysis["disease_detection"]["name"],
        "severity": analysis["disease_detection"]["severity"],
        "confidence": analysis["disease_detection"]["confidence"],
        "maturityStage": analysis["harvest_maturity"]["stage"],
        "readyForHarvest": analysis["harvest_maturity"]["ready_for_harvest"],
        "recommendations": analysis["disease_detection"]["treatments"],
        "imageUrl": payload.image_base64[:140000],
        "source": "ai_vision",
        "speciesStatus": "verified",
        "createdAt": now,
        "diagnosisId": diag_id,
        "maturityId": mat_id,
    }
    scan_res = await db["scans"].insert_one(scan_doc)
    scan_id = str(scan_res.inserted_id)

    return {
        "success": True,
        "scan_id": scan_id,
        "plant_id": plant_id,
        "plant_name": plant_name,
        "diagnosis_id": diag_id,
        "maturity_id": mat_id,
        "analysis": analysis,
    }


@router.post("/maturity")
async def analyze_maturity_endpoint(
    payload: Base64AnalyzeRequest,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    """Dedicated endpoint to assess Aloe Vera harvest maturity and leaf thickness."""
    try:
        img = decode_image_bytes(payload.image_base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}") from exc

    analysis = analyze_aloe_characteristics(img)
    if not analysis["species_identification"]["is_aloe_vera"]:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Species Rejection",
                "message": analysis["species_identification"]["rejection_reason"],
            },
        )

    now = datetime.now(timezone.utc)
    user_id = str(user["_id"])
    plant_name = payload.plant_name or "Aloe Specimen"

    record = {
        "plant_id": payload.plant_id or "unassigned",
        "plant_name": plant_name,
        "stage": analysis["harvest_maturity"]["stage"],
        "maturity_index": analysis["harvest_maturity"]["maturity_index"],
        "leaf_count": analysis["harvest_maturity"]["estimated_leaf_count"],
        "leaf_thickness_mm": analysis["harvest_maturity"]["estimated_leaf_thickness_mm"],
        "ready_for_harvest": analysis["harvest_maturity"]["ready_for_harvest"],
        "notes": analysis["harvest_maturity"]["harvest_guidance"],
        "owner_id": user_id,
        "created_at": now,
        "updated_at": now,
    }
    res = await db["maturity"].insert_one(record)
    record["id"] = str(res.inserted_id)
    record.pop("_id", None)

    return {
        "maturity": analysis["harvest_maturity"],
        "record": record,
    }

