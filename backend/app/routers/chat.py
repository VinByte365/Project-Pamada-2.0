from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["Chatbot"])

ALOE_KEYWORDS = {
    "aloe",
    "aloe vera",
    "barbadensis",
    "succulent",
    "leaf",
    "leaves",
    "plant",
    "soil",
    "water",
    "watering",
    "sunlight",
    "sun",
    "fertilizer",
    "fertiliser",
    "npk",
    "ph",
    "moisture",
    "disease",
    "pest",
    "harvest",
    "maturity",
    "grading",
    "propagation",
    "offset",
    "pup",
    "repot",
    "drainage",
    "humidity",
    "temperature",
}

TOPIC_RESPONSES = {
    "water": "Aloe vera prefers deep but infrequent watering. Let the soil dry out between waterings, and avoid leaving the pot sitting in water, since excess moisture can cause root rot.",
    "soil": "Use a well-draining mix for aloe vera, such as cactus or succulent soil with added perlite or coarse sand. Good drainage is more important than rich soil.",
    "sun": "Aloe vera grows best in bright, indirect sunlight or gentle direct sun. Too much harsh afternoon sun can scorch the leaves, while too little light can make the plant stretch and weaken.",
    "fertilizer": "Feed aloe vera sparingly. A diluted succulent fertilizer during the active growing season is usually enough; avoid over-fertilizing, which can damage the roots.",
    "ph": "Aloe vera generally prefers slightly acidic to neutral soil, around pH 6.0 to 7.0. If readings are far outside this range, adjust gradually and retest.",
    "disease": "Common aloe vera problems include root rot, leaf rot, and fungal issues, often caused by overwatering or poor drainage. Remove affected tissue, improve airflow, and let the soil dry before watering again.",
    "pest": "Aloe vera can occasionally attract mealybugs, scale, or aphids. Inspect the leaves and base regularly, isolate affected plants, and use gentle treatment such as wiping pests away or using an appropriate horticultural soap.",
    "harvest": "Harvest mature aloe vera leaves from the outer base of the plant. Choose thick, healthy leaves and avoid removing too many at once so the plant can recover.",
    "maturity": "Maturity depends on leaf size, thickness, color, and overall plant vigor. For aloe vera, older outer leaves are usually more ready for harvest than young inner leaves.",
    "grading": "Post-harvest grading usually considers leaf size, shape, surface quality, damage, and overall cleanliness. Consistent grading helps estimate yield and value more accurately.",
    "propagation": "Aloe vera is commonly propagated through offsets or pups. Wait until a pup is large enough, then separate it carefully and let the cut surface dry before planting.",
    "repot": "Repot aloe vera when it becomes root-bound or top-heavy. Use a slightly larger pot with drainage holes and fresh well-draining soil.",
}

DECLINE_MESSAGE = (
    "I can only help with aloe vera farming questions, such as watering, soil, sunlight, "
    "pests, diseases, harvesting, maturity, grading, propagation, and environmental readings. "
    "Please ask me something related to aloe vera and I will gladly help."
)

GENERAL_MESSAGE = (
    "I can help with aloe vera care and farming topics. Try asking about watering, soil, "
    "sunlight, pests, diseases, harvesting, maturity, grading, propagation, or sensor readings."
)


def _is_aloe_related(message: str) -> bool:
    lowered = message.lower()
    return any(keyword in lowered for keyword in ALOE_KEYWORDS)


def _topic_response(message: str) -> str:
    lowered = message.lower()
    for topic, response in TOPIC_RESPONSES.items():
        if topic in lowered:
            return response
    return GENERAL_MESSAGE


@router.post("")
async def chat(payload: dict) -> dict:
    message = str(payload.get("message", "")).strip()
    if not message:
        return {"reply": "Please enter an aloe vera question and I will help."}

    if not _is_aloe_related(message):
        return {"reply": DECLINE_MESSAGE}

    return {"reply": _topic_response(message)}
