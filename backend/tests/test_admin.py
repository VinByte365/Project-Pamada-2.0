from bson import ObjectId
import pytest
from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.main import create_app

app = create_app()


@pytest.fixture
def grower_headers():
    token = create_access_token({
        "sub": str(ObjectId()),
        "email": "grower_unit@farmsystem.test",
        "role": "grower",
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers():
    token = create_access_token({
        "sub": str(ObjectId()),
        "email": "admin_unit@farmsystem.test",
        "role": "admin",
    })
    return {"Authorization": f"Bearer {token}"}


def test_admin_access_forbidden_for_grower(grower_headers):
    with TestClient(app) as client:
        res = client.get("/admin/stats", headers=grower_headers)
    assert res.status_code == 403
    assert "Admin privileges required" in res.json()["detail"]


def test_admin_stats_success(admin_headers):
    with TestClient(app) as client:
        res = client.get("/admin/stats", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "users" in data
    assert "plants" in data
    assert "scans" in data
    assert "model_status" in data


def test_admin_users_list(admin_headers):
    with TestClient(app) as client:
        res = client.get("/admin/users", headers=admin_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_admin_scans_list(admin_headers):
    with TestClient(app) as client:
        res = client.get("/admin/scans", headers=admin_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
