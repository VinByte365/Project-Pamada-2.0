from fastapi.testclient import TestClient

from app.main import app


def test_auth_required_for_protected_route() -> None:
    with TestClient(app) as client:
        response = client.get("/auth/me")
    assert response.status_code == 401


def test_farms_requires_auth() -> None:
    with TestClient(app) as client:
        response = client.get("/farms/")
    assert response.status_code == 401


def test_sync_upload_requires_auth() -> None:
    with TestClient(app) as client:
        response = client.post("/sync/upload", json=[])
    assert response.status_code == 401
