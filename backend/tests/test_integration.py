from fastapi.testclient import TestClient
import pytest
from app.main import app
from app.core.security import create_access_token


@pytest.fixture
def auth_headers():
    token = create_access_token({
        "sub": "6adaf785fca0d55f907d0b8b",
        "email": "test@example.com",
        "name": "Integration Test Grower",
        "role": "grower",
        "aud": "authenticated",
        "user_metadata": {"name": "Integration Test Grower"},
    })
    return {"Authorization": f"Bearer {token}"}


def test_health():
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json() == {"status": "ok"}


def test_auth_me_with_token(auth_headers):
    with TestClient(app) as client:
        res = client.get("/auth/me", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert "email" in data or "id" in data


def test_farms_crud(auth_headers):
    with TestClient(app) as client:
        # Create
        create_res = client.post(
            "/farms/",
            json={
                "name": "Test Parcel Alpha",
                "location": "Sector 9",
                "soil_type": "Sandy Loam",
                "status": "Active",
            },
            headers=auth_headers,
        )
        assert create_res.status_code == 201
        farm = create_res.json()
        farm_id = farm["id"]
        assert farm["name"] == "Test Parcel Alpha"

        # List
        list_res = client.get("/farms/", headers=auth_headers)
        assert list_res.status_code == 200
        items = list_res.json()
        assert any(item["id"] == farm_id for item in items)

        # Get
        get_res = client.get(f"/farms/{farm_id}", headers=auth_headers)
        assert get_res.status_code == 200
        assert get_res.json()["id"] == farm_id

        # Update
        update_res = client.put(
            f"/farms/{farm_id}",
            json={"name": "Updated Parcel Alpha", "status": "Harvesting"},
            headers=auth_headers,
        )
        assert update_res.status_code == 200
        assert update_res.json()["name"] == "Updated Parcel Alpha"

        # Delete
        del_res = client.delete(f"/farms/{farm_id}", headers=auth_headers)
        assert del_res.status_code == 204


def test_plants_crud(auth_headers):
    with TestClient(app) as client:
        # Create
        create_res = client.post(
            "/plants/",
            json={
                "name": "Aloe Test Plant #01",
                "variety": "Aloe Barbadensis Miller",
                "stage": "Mature",
                "health_status": "Healthy",
            },
            headers=auth_headers,
        )
        assert create_res.status_code == 201
        plant = create_res.json()
        plant_id = plant["id"]

        # List
        list_res = client.get("/plants/", headers=auth_headers)
        assert list_res.status_code == 200
        assert any(p["id"] == plant_id for p in list_res.json())

        # Delete
        del_res = client.delete(f"/plants/{plant_id}", headers=auth_headers)
        assert del_res.status_code == 204


def test_diagnoses_crud(auth_headers):
    with TestClient(app) as client:
        # Create
        create_res = client.post(
            "/diagnoses/",
            json={
                "diagnosis": "Healthy",
                "confidence": 95,
                "severity": "None",
                "symptoms": "Optimal condition",
            },
            headers=auth_headers,
        )
        assert create_res.status_code == 201
        diag_id = create_res.json()["id"]

        # List
        list_res = client.get("/diagnoses/", headers=auth_headers)
        assert list_res.status_code == 200
        assert any(d["id"] == diag_id for d in list_res.json())

        # Delete
        del_res = client.delete(f"/diagnoses/{diag_id}", headers=auth_headers)
        assert del_res.status_code == 204


def test_sensors_crud(auth_headers):
    with TestClient(app) as client:
        create_res = client.post(
            "/sensors/",
            json={
                "device_id": "TEST-PROBE-01",
                "nitrogen": 35.0,
                "phosphorus": 22.0,
                "potassium": 210.0,
                "moisture": 30.0,
                "ph": 6.8,
            },
            headers=auth_headers,
        )
        assert create_res.status_code == 201
        sensor_id = create_res.json()["id"]

        list_res = client.get("/sensors/", headers=auth_headers)
        assert list_res.status_code == 200
        assert any(s["id"] == sensor_id for s in list_res.json())

        del_res = client.delete(f"/sensors/{sensor_id}", headers=auth_headers)
        assert del_res.status_code == 204


def test_maturity_and_gradings_crud(auth_headers):
    with TestClient(app) as client:
        # Maturity
        mat_res = client.post(
            "/maturity/",
            json={"stage": "Harvest Ready", "leaf_count": 16, "ready_for_harvest": True},
            headers=auth_headers,
        )
        assert mat_res.status_code == 201
        mat_id = mat_res.json()["id"]

        del_mat = client.delete(f"/maturity/{mat_id}", headers=auth_headers)
        assert del_mat.status_code == 204

        # Grading
        grade_res = client.post(
            "/gradings/",
            json={"grade": "Grade A", "quality_score": 95, "weight_kg": 25.0},
            headers=auth_headers,
        )
        assert grade_res.status_code == 201
        grade_id = grade_res.json()["id"]

        del_grade = client.delete(f"/gradings/{grade_id}", headers=auth_headers)
        assert del_grade.status_code == 204


def test_reports_crud(auth_headers):
    with TestClient(app) as client:
        res = client.post(
            "/reports/",
            json={
                "title": "Integration Test Harvest Cycle",
                "revenue": 10000,
                "expenses": 3000,
                "net_profit": 7000,
            },
            headers=auth_headers,
        )
        assert res.status_code == 201
        report_id = res.json()["id"]

        del_res = client.delete(f"/reports/{report_id}", headers=auth_headers)
        assert del_res.status_code == 204


def test_community_and_comments(auth_headers):
    with TestClient(app) as client:
        # Post
        post_res = client.post(
            "/community/posts/",
            json={"title": "Test Agronomy Post", "content": "How to optimize NPK?"},
            headers=auth_headers,
        )
        assert post_res.status_code == 201
        post_id = post_res.json()["id"]

        # Comment
        com_res = client.post(
            "/comments/",
            json={"post_id": post_id, "content": "Maintain 20-50 mg/kg nitrogen."},
            headers=auth_headers,
        )
        assert com_res.status_code == 201
        com_id = com_res.json()["id"]

        # Cleanup
        client.delete(f"/comments/{com_id}", headers=auth_headers)
        client.delete(f"/community/posts/{post_id}", headers=auth_headers)

