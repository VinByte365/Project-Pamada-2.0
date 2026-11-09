import base64
import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.core.security import create_access_token
from app.main import create_app

app = create_app()


def create_test_image(color=(34, 139, 34), size=(200, 200)) -> str:
    """Helper to generate a base64 encoded JPEG image."""
    img = Image.new("RGB", size, color=color)
    bio = io.BytesIO()
    img.save(bio, format="JPEG")
    return base64.b64encode(bio.getvalue()).decode("utf-8")


@pytest.fixture
def auth_headers():
    token = create_access_token({
        "sub": "6af1d8c7f3a5b810089915c9",
        "email": "farmer@gmail.com",
        "role": "admin",
    })
    return {"Authorization": f"Bearer {token}"}


def test_vision_status():
    with TestClient(app) as client:
        res = client.get("/vision/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "Aloe barbadensis Miller" in data["species_supported"]
    assert data["supported_diseases_count"] >= 9


def test_vision_diseases():
    with TestClient(app) as client:
        res = client.get("/vision/diseases")
    assert res.status_code == 200
    data = res.json()
    assert "Leaf Spot" in data["diseases"]
    assert "Sunburn" in data["diseases"]
    assert "Root Rot" in data["diseases"]
    assert "Mealy Bugs" in data["diseases"]


def test_vision_rejection_non_aloe(auth_headers):
    # Pure blue / sky image without foliar chlorophyll must be rejected
    blue_img = create_test_image(color=(20, 40, 240))
    with TestClient(app) as client:
        res = client.post(
            "/vision/analyze",
            json={"image_base64": blue_img, "plant_name": "Test Blue Non-Plant"},
            headers=auth_headers,
        )
    assert res.status_code == 422
    data = res.json()
    assert data["detail"]["is_aloe_vera"] is False
    assert "Species Rejection" in data["detail"]["error"]


def test_vision_analyze_aloe_success(auth_headers):
    # Succulent green Aloe color
    green_img = create_test_image(color=(45, 125, 55))
    with TestClient(app) as client:
        res = client.post(
            "/vision/analyze",
            json={"image_base64": green_img, "plant_name": "Test Aloe Green"},
            headers=auth_headers,
        )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["analysis"]["species_identification"]["is_aloe_vera"] is True
    assert data["analysis"]["harvest_maturity"]["stage"] in [
        "Young / Not Yet Mature",
        "Developing",
        "Mature / Potentially Ready for Harvest",
    ]


def test_vision_maturity_endpoint(auth_headers):
    green_img = create_test_image(color=(50, 130, 60))
    with TestClient(app) as client:
        res = client.post(
            "/vision/maturity",
            json={"image_base64": green_img, "plant_name": "Maturity Specimen"},
            headers=auth_headers,
        )
    assert res.status_code == 200
    data = res.json()
    assert "maturity_index" in data["maturity"]
    assert "estimated_leaf_thickness_mm" in data["maturity"]

