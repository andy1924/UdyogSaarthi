from __future__ import annotations

from typing import Any

from app.services import geo_service


class _Response:
    status_code = 200

    @staticmethod
    def json() -> dict[str, list[dict[str, str]]]:
        return {
            "records": [
                {
                    "state_name": "Bihar",
                    "district_name": "Nalanda",
                    "block_name": "Hilsa",
                    "block_lgd_code": "12345",
                }
            ]
        }


class _Client:
    def __init__(self, captured: dict[str, Any]) -> None:
        self.captured = captured

    async def __aenter__(self) -> "_Client":
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def get(self, url: str, *, params: dict[str, str]) -> _Response:
        self.captured["url"] = url
        self.captured["params"] = params
        return _Response()


async def test_lgd_lookup_sends_data_gov_api_key(monkeypatch) -> None:
    """The protected data.gov.in datastore endpoint requires ``api-key``."""
    captured: dict[str, Any] = {}

    async def cache_miss(*_: object) -> None:
        return None

    async def cache_set(*_: object) -> None:
        return None

    monkeypatch.setattr(geo_service.cache, "get_json", cache_miss)
    monkeypatch.setattr(geo_service.cache, "set_json", cache_set)
    monkeypatch.setattr(geo_service.settings, "data_gov_api_key", "test-key")
    monkeypatch.setattr(
        geo_service.httpx,
        "AsyncClient",
        lambda **_: _Client(captured),
    )

    resolved = await geo_service.resolve_lgd_live("Nalanda", "Hilsa", "Bihar")

    assert captured["params"]["api-key"] == "test-key"
    assert resolved is not None
    assert resolved["lgd_code"] == "12345"
