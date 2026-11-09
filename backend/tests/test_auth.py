import time
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


def test_register_and_login() -> None:
    unique_email = f"grower_{int(time.time())}@farmsystem.test"
    with TestClient(app) as client:
        # Register
        reg_res = client.post(
            "/auth/register",
            json={
                "name": "Auto Test Grower",
                "email": unique_email,
                "password": "SecretPassword123!",
                "role": "grower",
            },
        )
        assert reg_res.status_code == 201
        data = reg_res.json()
        assert "token" in data
        assert data["user"]["email"] == unique_email
        token = data["token"]

        # Verify access to /auth/me with bearer token
        me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == unique_email

        # Login with same credentials
        login_res = client.post(
            "/auth/login",
            json={
                "email": unique_email,
                "password": "SecretPassword123!",
            },
        )
        assert login_res.status_code == 200
        assert "token" in login_res.json()
