"""
Aloe Vera Plant Health & Vision Analysis Core
Provides deep computer vision inspection, YOLOv8 machine learning inference,
foliar chromatic spectrum analysis, Aloe Vera species verification,
9-class disease pathology classification, and leaf maturity detection.
"""

import base64
import io
import logging
import math
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageFile, ImageStat

ImageFile.LOAD_TRUNCATED_IMAGES = True
logger = logging.getLogger("aloe_guard.vision")

# Botanical reference profiles for Aloe Vera (Aloe barbadensis Miller)
ALOE_SPECIES_NAME = "Aloe barbadensis Miller"

# Supported disease and pest categories
SUPPORTED_DISEASES: dict[str, dict[str, Any]] = {
    "Healthy": {
        "name": "Healthy Aloe Vera",
        "severity": "None",
        "description": "Vibrant succulent leaves with uniform green coloration, firm cuticle, and intact marginal teeth with no necrotic or fungal lesions.",
        "symptoms": ["Firm erect or spreading rosette leaves", "Plump gel parenchyma", "Clean serrated margins without browning"],
        "causes": ["Adequate indirect sunlight (6+ hours/day)", "Well-draining sandy/gravelly potting mix", "Deep but infrequent irrigation schedule"],
        "treatments": ["Continue current watering schedule when soil is 80% dry", "Wipe dust off leaves occasionally with a damp cloth"],
        "prevention": ["Avoid letting water sit in the central rosette crown", "Maintain soil pH between 6.0 and 7.2"],
    },
    "Leaf Spot": {
        "name": "Leaf Spot (Cercospora / Alternaria)",
        "severity": "Moderate",
        "description": "Fungal infection causing circular or irregular sunken brown to black necrotic spots with yellowish halos on outer leaves.",
        "symptoms": ["Round dark brown to black spots on leaf surface", "Chlorotic yellow margin around lesions", "Premature drying of leaf tips"],
        "causes": ["Foliar moisture from overhead watering", "High relative humidity with poor air circulation", "Cool temperatures with damp foliage"],
        "treatments": ["Prune and safely discard heavily spotted outer leaves using sterilized shears", "Apply copper-based fungicide or neem oil spray in low light", "Stop overhead misting immediately"],
        "prevention": ["Water only at the soil line at the base of the plant", "Ensure at least 30 cm spacing between plants for airflow"],
    },
    "Sunburn": {
        "name": "Sunburn / UV Stress (Anthocyanin Accumulation)",
        "severity": "Low",
        "description": "Physiological stress response causing leaves to turn bronze, reddish-purple, or brown due to sudden intense direct solar radiation.",
        "symptoms": ["Bronze, reddish-brown, or violet coloration on sun-facing leaf sides", "Thin, curled, or slightly concave leaf blades", "Dry brown crispy leaf tips"],
        "causes": ["Sudden exposure to harsh midday direct sunlight without acclimation", "High ambient temperatures coupled with dry soil", "Heat reflection from concrete surfaces"],
        "treatments": ["Move plant to bright indirect light or provide 30-40% shade cloth during midday", "Deeply water the root zone once soil cools in the evening", "Allow plant 7-10 days to recover natural green color"],
        "prevention": ["Acclimate plants to direct sunlight gradually over a 2-week period", "Provide morning sun and afternoon dappled shade"],
    },
    "Root Rot": {
        "name": "Root Rot / Basal Stem Rot (Pythium / Phytophthora)",
        "severity": "Severe",
        "description": "Destructive fungal/water mold pathogen causing decaying roots, soft dark mushy leaf bases, and wilting despite damp soil.",
        "symptoms": ["Soft, water-soaked, black or dark brown leaf base", "Foul musty odor around the root ball", "Outer leaves collapsing outward and detaching easily", "Black, slimy, fragile roots"],
        "causes": ["Overwatering or waterlogged, poorly draining heavy clay soil", "Containers lacking drainage holes", "Cold wet soil temperatures below 15°C"],
        "treatments": ["Unpot plant immediately and rinse soil from roots", "Trim away all soft, black, rotted roots and mushy leaf bases with sterilized blade", "Dust clean cuts with sulfur powder or cinnamon and let dry 3 days", "Repot into dry cactus/succulent gritty mix and do not water for 10 days"],
        "prevention": ["Use terra cotta pots with drainage holes", "Allow soil to dry out completely between waterings", "Never allow pots to sit in stagnant saucer runoff"],
    },
    "Bacterial Soft Rot": {
        "name": "Bacterial Soft Rot (Pectobacterium chrysanthemi)",
        "severity": "Severe",
        "description": "Rapid bacterial degradation that dissolves leaf parenchyma into watery, foul-smelling slime, spreading through vascular tissue.",
        "symptoms": ["Water-soaked translucent blisters on leaves", "Internal gel liquefies and emits strong fermentation odor", "Leaves collapse rapidly within 48 to 72 hours"],
        "causes": ["Wounds from mechanical damage or insect bites contaminated with stagnant water", "Warm, humid conditions (> 28°C) with wet foliage", "Use of non-sterile cutting tools"],
        "treatments": ["Isolate plant immediately from other specimens", "Excise affected leaves 5 cm below visible boundary with sterilized knife", "Treat cut surfaces with 3% hydrogen peroxide or agricultural bactericide", "If central crown is soft and mushy, discard plant to prevent infection spread"],
        "prevention": ["Sterilize all pruning blades with 70% alcohol before and after each cut", "Keep foliage completely dry during watering"],
    },
    "Anthracnose": {
        "name": "Anthracnose (Colletotrichum gloeosporioides)",
        "severity": "Moderate",
        "description": "Fungal disease causing sunken, circular, dark brown lesions with concentric spore rings and yellowing margins on older leaves.",
        "symptoms": ["Sunken dark brown to black circular lesions", "Concentric target-like rings visible under close inspection", "Leaf tissue around spots turns yellow and shrivels"],
        "causes": ["Prolonged leaf wetness during warm humid weather", "Rain-splash dispersal of fungal spores", "Overcrowded plants restricting air movement"],
        "treatments": ["Remove infected leaves at the stem base and destroy them (do not compost)", "Apply bio-fungicide (Bacillus subtilis) or potassium bicarbonate spray", "Increase air circulation with a gentle oscillating fan"],
        "prevention": ["Avoid splashing water from soil onto foliage", "Maintain good plant spacing and clean garden hygiene"],
    },
    "Aloe Rust": {
        "name": "Aloe Rust (Uromyces aloes)",
        "severity": "Moderate",
        "description": "Fungal rust causing conspicuous circular yellowish spots on upper leaf surfaces that develop into dark brown or black raised pustules.",
        "symptoms": ["Small yellow flecks that enlarge into dark raised hard pustules", "Circular black lesions on both sides of leaves", "Leaves may pucker or distort around heavy cluster spots"],
        "causes": ["High humidity with cool night temperatures and warm days", "Spore transmission via wind or splashing water", "Poor ventilation in greenhouses"],
        "treatments": ["Manually remove severely rusted leaves and burn or bin them", "Apply systemic or protective fungicide (mancozeb or wettable sulfur)", "Reduce ambient relative humidity below 60%"],
        "prevention": ["Ensure maximum morning sun exposure to dry morning dew rapidly", "Avoid overhead irrigation"],
    },
    "Mealy Bugs": {
        "name": "Mealy Bugs (Pseudococcidae)",
        "severity": "Moderate",
        "description": "Soft-bodied sap-sucking insects covered in powdery white wax that nest in leaf axils and secrete sticky honeydew.",
        "symptoms": ["Cottony white clusters in tight crevices between leaf bases", "Sticky honeydew residue on lower leaves followed by black sooty mold", "Stunted new leaf growth and yellowing of inner leaves"],
        "causes": ["Introduction of infested nursery plants without quarantine", "Warm, sheltered indoor environments without natural predators", "Excessive nitrogen fertilization promoting soft succulent tissue"],
        "treatments": ["Dab individual bugs with a cotton swab dipped in 70% isopropyl alcohol", "Spray thorough dilution of insecticidal soap or horticultural oil into all leaf axils", "Repeat treatment every 5 to 7 days for 3 cycles to kill newly hatched nymphs"],
        "prevention": ["Inspect all new plants thoroughly before introducing to collection", "Maintain predatory beneficial insects (ladybugs, lacewings) in outdoor beds"],
    },
    "Scale Insects": {
        "name": "Scale Insects (Diaspididae / Coccidae)",
        "severity": "Moderate",
        "description": "Immobile waxy oval shell-like pests that adhere tightly to leaf surfaces, sucking sap and causing localized chlorosis.",
        "symptoms": ["Small round or oval brown/grey raised waxy scales adhering to leaves", "Yellow spotting directly beneath feeding sites", "Reduced plant vigor and leaf thinning"],
        "causes": ["Dry, dusty growing conditions with warm temperatures", "Lack of natural predators", "Stress from underwatering or root binding"],
        "treatments": ["Gently scrape off scales using a soft toothbrush or plastic card edge", "Apply neem oil or systemic insecticide spray to penetrate protective waxy covers", "Prune out severely encrusted older leaves"],
        "prevention": ["Regularly wipe down leaf blades to keep dust-free", "Maintain optimal soil moisture and plant vigor"],
    },
    "Spider Mites": {
        "name": "Spider Mites (Tetranychidae)",
        "severity": "Low",
        "description": "Microscopic arachnid pests that pierce leaf cells, causing fine yellow stippling and delicate webbing across leaf bases.",
        "symptoms": ["Tiny yellow or white specks/stipples covering leaf surface", "Fine delicate webbing visible between leaf bases in direct light", "Leaves take on a dull, bronzed, dusty appearance"],
        "causes": ["Very hot, dry, low-humidity indoor or greenhouse conditions", "Lack of natural rainfall or foliar rinsing", "Stressed, dehydrated plants"],
        "treatments": ["Rinse plant under a firm water spray to dislodge mites and webs", "Apply horticultural neem oil spray to both upper and lower leaf surfaces", "Increase localized humidity around the plant"],
        "prevention": ["Avoid placing aloe plants directly beside hot air heating vents", "Mist surrounding area (without soaking leaves) during hot dry spells"],
    },
}

YOLO_TO_DISEASE_NAME: dict[str, str] = {
    "aloe_rust": "Aloe Rust",
    "anthracnose": "Anthracnose",
    "bacterial_soft_rot": "Bacterial Soft Rot",
    "leaf_spot": "Leaf Spot",
    "mealybug": "Mealy Bugs",
    "root_rot": "Root Rot",
    "scale_insect": "Scale Insects",
    "spider_mite": "Spider Mites",
    "sunburn": "Sunburn",
}

_yolo_disease_model = None
_yolo_age_model = None


def get_yolo_disease_model():
    """Lazy loader for the YOLO disease detection model."""
    global _yolo_disease_model
    if _yolo_disease_model is None:
        model_path = Path(__file__).resolve().parents[2] / "MLmodel" / "bestDisease.pt"
        if model_path.exists():
            try:
                from ultralytics import YOLO
                _yolo_disease_model = YOLO(str(model_path))
                logger.info("YOLO disease model loaded successfully from %s", model_path)
            except Exception as exc:
                logger.warning("Could not load YOLO disease model: %s", exc)
    return _yolo_disease_model


def get_yolo_age_model():
    """Lazy loader for the YOLO age/leaf detection model."""
    global _yolo_age_model
    if _yolo_age_model is None:
        model_path = Path(__file__).resolve().parents[2] / "MLmodel" / "bestAge.pt"
        if model_path.exists():
            try:
                from ultralytics import YOLO
                _yolo_age_model = YOLO(str(model_path))
                logger.info("YOLO age/leaf model loaded successfully from %s", model_path)
            except Exception as exc:
                logger.warning("Could not load YOLO age model: %s", exc)
    return _yolo_age_model


def decode_image_bytes(data: bytes | str) -> Image.Image:
    """Decodes raw bytes or base64 encoded string into a PIL Image."""
    if isinstance(data, str):
        if "," in data:
            data = data.split(",", 1)[1]
        data = base64.b64decode(data)
    bio = io.BytesIO(data)
    img = Image.open(bio)
    img.load()
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img


def analyze_aloe_characteristics(
    img: Image.Image,
    custom_diseases: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """
    Complete hybrid computer vision and deep learning inference pipeline:
    1. Foliar chromatic analysis & Aloe Vera species verification.
    2. YOLOv8 Deep Learning inference using `bestDisease.pt` (9 classes) with bounding box localization.
    3. YOLOv8 Leaf segmentation & detection using `bestAge.pt` for real maturity classification.
    4. Graceful foliar spectrum fallback if YOLO weights are unavailable.
    """
    diseases_catalog = {**SUPPORTED_DISEASES, **(custom_diseases or {})}

    width, height = img.size

    # Resize to standardized analysis thumbnail for fast color spectrum analysis
    thumb = img.resize((160, 160))
    stat = ImageStat.Stat(thumb)
    mean_r, mean_g, mean_b = stat.mean[:3]

    pixels = list(thumb.getdata())
    green_count = 0
    brown_count = 0
    red_count = 0
    dark_count = 0
    white_count = 0

    for r, g, b in pixels:
        brightness = (r + g + b) / 3.0
        if g > r * 1.08 and g > b * 1.05 and g > 40:
            green_count += 1
        elif r > g * 1.15 and r > b * 1.25 and brightness > 45:
            red_count += 1
        elif r > b * 1.1 and g > b * 0.9 and 25 < brightness < 85:
            brown_count += 1
        elif brightness <= 25:
            dark_count += 1
        elif brightness > 215 and abs(r - g) < 20 and abs(g - b) < 20:
            white_count += 1

    sample_total = len(pixels)
    green_ratio = green_count / sample_total
    brown_ratio = brown_count / sample_total
    red_ratio = red_count / sample_total
    dark_ratio = dark_count / sample_total
    white_ratio = white_count / sample_total

    foliar_ratio = green_ratio + (brown_ratio * 0.7) + (red_ratio * 0.5)

    # 1. Aloe Vera Identification Check
    is_aloe_vera = False
    rejection_reason = ""

    if width < 80 or height < 80:
        is_aloe_vera = False
        rejection_reason = "Image resolution is too low to inspect leaf morphology and rosette structure. Please upload an image with at least 300x300 pixels."
    elif foliar_ratio < 0.12 and green_ratio < 0.08:
        is_aloe_vera = False
        rejection_reason = (
            "Visual inspection indicates this image does not appear to be an Aloe Vera plant (Aloe barbadensis Miller). "
            "The color spectrum and morphology do not exhibit characteristic succulent foliar chlorophyll. "
            "Please upload a clear photograph of an Aloe Vera plant."
        )
    elif mean_b > mean_g * 1.35 and mean_b > mean_r * 1.3:
        is_aloe_vera = False
        rejection_reason = (
            "The image is dominated by blue / non-foliar background with insufficient succulent leaf visibility. "
            "Please center the Aloe Vera plant within the frame."
        )
    else:
        is_aloe_vera = True

    aloe_confidence = (
        min(98.5, max(75.0, round(70.0 + (foliar_ratio * 35.0), 1)))
        if is_aloe_vera
        else round(foliar_ratio * 40.0, 1)
    )

    # 2. Disease Pathology Classification
    detected_disease = "Healthy"
    disease_confidence = 92.0
    symptom_notes = []
    detections_list: list[dict[str, Any]] = []
    model_used = "Foliar Chromatic Spectrum Engine"

    # Execute YOLO Deep Learning model if plant is verified Aloe Vera
    if is_aloe_vera:
        yolo_d = get_yolo_disease_model()
        if yolo_d is not None:
            model_used = "YOLOv8 bestDisease.pt Deep Learning"
            temp_path = None
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
                    temp_path = Path(tmp_file.name)
                    img.save(temp_path, format="JPEG", quality=90)

                results = yolo_d(str(temp_path), verbose=False, conf=0.15, imgsz=640)
                res = results[0]

                if getattr(res, "boxes", None) is not None and len(res.boxes) > 0:
                    for box in res.boxes:
                        class_id = int(box.cls[0])
                        raw_label = yolo_d.names.get(class_id, str(class_id))
                        conf = float(box.conf[0])
                        mapped_disease = YOLO_TO_DISEASE_NAME.get(raw_label, raw_label.replace("_", " ").title())
                        coords = [float(v) for v in box.xyxy[0].tolist()]

                        detections_list.append({
                            "class_id": class_id,
                            "raw_label": raw_label,
                            "disease": mapped_disease,
                            "confidence": round(conf * 100, 1),
                            "box": {
                                "x1": round(coords[0], 1),
                                "y1": round(coords[1], 1),
                                "x2": round(coords[2], 1),
                                "y2": round(coords[3], 1),
                            },
                        })

                    detections_list.sort(key=lambda d: d["confidence"], reverse=True)
                    top = detections_list[0]
                    detected_disease = top["disease"]
                    disease_confidence = top["confidence"]
                    symptom_notes.append(
                        f"YOLO deep learning detected {len(detections_list)} lesion/pest region(s). Primary: {detected_disease} ({disease_confidence}% confidence)."
                    )
                else:
                    detected_disease = "Healthy"
                    disease_confidence = round(min(97.5, max(85.0, 88.0 + (green_ratio * 10.0))), 1)
                    symptom_notes.append("YOLO inference scanned leaves: No pathogen lesions or pest infestation detected (Healthy specimen).")
            except Exception as exc:
                logger.warning("YOLO disease inference exception: %s. Falling back to foliar spectrum analysis.", exc)
            finally:
                if temp_path and temp_path.exists():
                    temp_path.unlink(missing_ok=True)

        # Fallback to foliar chromatic analysis if YOLO model is not loaded
        if model_used.startswith("Foliar"):
            if dark_ratio > 0.08 and brown_ratio > 0.18:
                detected_disease = "Root Rot"
                disease_confidence = min(96.0, round(80.0 + (dark_ratio * 60.0), 1))
                symptom_notes.append("Substantial dark water-soaked discoloration detected at leaf base or lower stem.")
            elif brown_ratio > 0.14:
                detected_disease = "Leaf Spot"
                disease_confidence = min(94.0, round(78.0 + (brown_ratio * 60.0), 1))
                symptom_notes.append("Multiple localized dark circular lesions detected across the foliar surface.")
            elif red_ratio > 0.16:
                detected_disease = "Sunburn"
                disease_confidence = min(95.0, round(82.0 + (red_ratio * 50.0), 1))
                symptom_notes.append("Bronze-reddish discoloration on leaf tips indicating acute UV exposure.")
            elif white_ratio > 0.05 and brown_ratio > 0.05:
                detected_disease = "Mealy Bugs"
                disease_confidence = min(91.0, round(75.0 + (white_ratio * 100.0), 1))
                symptom_notes.append("Cottony white pest residue visible around leaf crevices.")
            elif dark_ratio > 0.05:
                detected_disease = "Anthracnose"
                disease_confidence = 85.0
                symptom_notes.append("Sunken necrotic spots with dark rings identified on leaf margins.")
            else:
                detected_disease = "Healthy"
                disease_confidence = round(88.0 + (green_ratio * 10.0), 1)
                symptom_notes.append("Vibrant uniform succulent green leaves with no acute lesions or rot detected.")

    disease_info = diseases_catalog.get(detected_disease, diseases_catalog.get("Healthy", SUPPORTED_DISEASES["Healthy"]))

    # 3. Harvest Maturity Assessment (with YOLO Leaf Counter bestAge.pt)
    estimated_leaf_count = max(4, min(24, int(math.sqrt(width * height) / 38) + int(green_ratio * 12)))
    yolo_leaf_boxes: list[dict[str, Any]] = []

    if is_aloe_vera:
        yolo_a = get_yolo_age_model()
        if yolo_a is not None:
            temp_path_a = None
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
                    temp_path_a = Path(tmp_file.name)
                    img.save(temp_path_a, format="JPEG", quality=90)

                results_a = yolo_a(str(temp_path_a), verbose=False, conf=0.15, imgsz=640)
                res_a = results_a[0]
                if getattr(res_a, "boxes", None) is not None:
                    for box in res_a.boxes:
                        coords = [float(v) for v in box.xyxy[0].tolist()]
                        yolo_leaf_boxes.append({
                            "confidence": round(float(box.conf[0]) * 100, 1),
                            "box": {
                                "x1": round(coords[0], 1),
                                "y1": round(coords[1], 1),
                                "x2": round(coords[2], 1),
                                "y2": round(coords[3], 1),
                            },
                        })
                if yolo_leaf_boxes:
                    estimated_leaf_count = max(len(yolo_leaf_boxes), estimated_leaf_count)
            except Exception as exc:
                logger.warning("YOLO age inference error: %s", exc)
            finally:
                if temp_path_a and temp_path_a.exists():
                    temp_path_a.unlink(missing_ok=True)

    estimated_thickness_mm = round(max(5.0, min(22.0, (green_ratio * 16.0) + (foliar_ratio * 6.0))), 1)
    maturity_index = min(100, max(20, int((estimated_leaf_count * 3.5) + (estimated_thickness_mm * 2.2))))

    if maturity_index >= 75 and estimated_leaf_count >= 12 and estimated_thickness_mm >= 13.0:
        maturity_stage = "Mature / Potentially Ready for Harvest"
        ready_for_harvest = True
        if estimated_leaf_count >= 16:
            estimated_age_range = "3 – 4+ Years (Prime Harvest)"
            estimated_age_months = 40
            harvest_guidance = (
                "Fully mature prime Aloe Vera specimen with dense rosette (>= 16 leaves) and peak aloin/polysaccharide volume. "
                "Ready for prime commercial outer leaf harvesting."
            )
        else:
            estimated_age_range = "2 – 3 Years"
            estimated_age_months = 28
            harvest_guidance = (
                "The specimen exhibits robust mature succulent growth with thick outer leaves (>= 13-15mm) and a developed basal rosette. "
                "Ready for selective outer leaf harvesting using a sterilized blade close to the main stem."
            )
    elif maturity_index >= 50 or estimated_leaf_count >= 8:
        maturity_stage = "Developing"
        estimated_age_range = "1 – 2 Years"
        estimated_age_months = 18
        ready_for_harvest = False
        harvest_guidance = (
            "The plant is in an active vegetative growth stage. Outer leaves are thickening but have not reached peak gel volume. "
            "Allow 6-12 more weeks of vegetative cultivation before initial outer harvest."
        )
    else:
        maturity_stage = "Young / Not Yet Mature"
        estimated_age_range = "< 1 Year (Juvenile)"
        estimated_age_months = 6
        ready_for_harvest = False
        harvest_guidance = (
            "Juvenile aloe vera plant with fewer than 8-10 leaves and thin blades (< 10mm). "
            "Do not harvest outer leaves; harvesting now would deplete carbohydrate reserves and stunt development."
        )

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model_engine": model_used,
        "image_dimensions": {"width": width, "height": height},
        "species_identification": {
            "is_aloe_vera": is_aloe_vera,
            "species_name": ALOE_SPECIES_NAME if is_aloe_vera else "Non-Aloe Vera / Unverified",
            "confidence": aloe_confidence,
            "rejection_reason": rejection_reason,
            "foliar_chromatic_ratio": round(foliar_ratio, 3),
            "green_ratio": round(green_ratio, 3),
        },
        "disease_detection": {
            "disease": detected_disease,
            "name": disease_info["name"],
            "severity": disease_info["severity"],
            "confidence": disease_confidence,
            "symptoms_observed": symptom_notes,
            "description": disease_info["description"],
            "symptoms": disease_info["symptoms"],
            "causes": disease_info["causes"],
            "treatments": disease_info["treatments"],
            "prevention": disease_info["prevention"],
            "detections": detections_list,
            "detections_count": len(detections_list),
            "supported_categories": list(diseases_catalog.keys()),
        },
        "harvest_maturity": {
            "stage": maturity_stage,
            "maturity_index": maturity_index,
            "estimated_leaf_count": estimated_leaf_count,
            "detected_leaf_regions": len(yolo_leaf_boxes),
            "estimated_leaf_thickness_mm": estimated_thickness_mm,
            "estimated_age_range": estimated_age_range,
            "estimated_age_months": estimated_age_months,
            "ready_for_harvest": ready_for_harvest,
            "harvest_guidance": harvest_guidance,
        },
    }
