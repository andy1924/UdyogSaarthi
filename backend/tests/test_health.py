from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_returns_status_payload() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] in {"ok", "degraded"}
    assert payload["database"] in {"up", "down"}
    assert payload["redis"] in {"up", "down"}
