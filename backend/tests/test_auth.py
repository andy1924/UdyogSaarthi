from fastapi.testclient import TestClient

from app.main import app


def test_dpr_render_requires_auth() -> None:
    client = TestClient(app)

    response = client.post("/api/dpr/render", json={})

    assert response.status_code == 401
    assert "Bearer" in response.headers.get("www-authenticate", "")


def test_feasibility_score_requires_auth() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/feasibility/score",
        json={
            "location_text": "Hilsa, Nalanda",
            "business_category": "retail",
            "population": 5000,
            "radius_m": 2000,
        },
    )

    assert response.status_code == 401
