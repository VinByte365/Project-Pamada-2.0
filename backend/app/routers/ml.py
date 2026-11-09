import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

logger = logging.getLogger("farmsystem.ml")

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

_model = None
_model_path = Path(__file__).resolve().parents[2] / "MLmodel" / "bestDisease.pt"


def get_disease_model():
    global _model
    if _model is None:
        if not _model_path.exists():
            raise HTTPException(status_code=503, detail="Disease model file is not available")
        try:
            from ultralytics import YOLO

            _model = YOLO(str(_model_path))
        except Exception as exc:
            logger.exception("Failed to load disease model")
            raise HTTPException(status_code=503, detail="Disease model could not be loaded") from exc
    return _model


@router.get("/disease/classes")
async def disease_classes() -> dict:
    model = get_disease_model()
    return {"classes": model.names}


@router.post("/disease")
async def detect_disease(file: UploadFile = File(...)) -> dict:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="An image file is required")

    suffix = Path(file.filename or "image.jpg").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = Path(temp_file.name)
        temp_file.write(await file.read())

    try:
        model = get_disease_model()
        results = model(str(temp_path), verbose=False, conf=0.1, imgsz=640)
        result = results[0]

        detections = []
        if getattr(result, "boxes", None) is not None:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                x1, y1, x2, y2 = [float(value) for value in box.xyxy[0].tolist()]
                detections.append(
                    {
                        "class_id": class_id,
                        "label": model.names.get(class_id, str(class_id)),
                        "confidence": confidence,
                        "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    }
                )

        detections.sort(key=lambda item: item["confidence"], reverse=True)
        top = detections[0] if detections else None

        logger.info(
            "Disease detection completed: %d detection(s), top=%s",
            len(detections),
            top["label"] if top else "none",
        )

        return {
            "top": top,
            "detections": detections,
            "count": len(detections),
            "message": "No disease region detected" if top is None else "Detection complete",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Disease detection failed")
        raise HTTPException(status_code=500, detail="Disease detection failed") from exc
    finally:
        temp_path.unlink(missing_ok=True)
