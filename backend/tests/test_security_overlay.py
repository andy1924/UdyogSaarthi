
from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import sys
import time
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import Request
from fastapi.testclient import TestClient
from jose import jwt

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.config import settings  # noqa: E402
from app.core.security.layer1_hmac import Layer1HMACMiddleware  # noqa: E402
from app.core.security.layer1_ratelimit import Layer1RateLimitMiddleware  # noqa: E402
from app.core.security.layer2_auth_middleware import Layer2AuthMiddleware  # noqa: E402
from app.core.security.layer2_jwt import decode_active_token, revoke_token  # noqa: E402
from app.core.security.layer2_rbac import RequireRole  # noqa: E402
from app.core.security.layer3_boundary import Layer3BoundaryMiddleware  # noqa: E402
from app.core.security.layer3_exceptions import (  # noqa: E402
    CorrelationIDMiddleware,
    sanitized_exception_handler,
)
from app.core.security.layer3_validation import (  # noqa: E402
    StrictBoundaryModel,
    bounded_float,
    bounded_int,
    sanitize_text,
)
from app.core.security.layer4_crypto import decrypt_field, encrypt_field  # noqa: E402
from app.core.security.layer4_rls import (  # noqa: E402
    RLS_POLICY_SQL,
    clear_rls_context,
    set_rls_context,
)
from app.core.security.setup_layer4 import setup_layer4_security  # noqa: E402
from app.routers.scheme import calculate as calculate_scheme  # noqa: E402
from app.schemas.scheme import SchemeCalculateIn  # noqa: E402


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}
        self.nonces: set[str] = set()
        self.rate_calls = 0
        self.rate_limit = 5

    async def set(self, key: str, value: str, ex: int | None = None, nx: bool = False):
        del ex
        if nx and key in self.nonces:
            return False
        if key.startswith("layer1:nonce:"):
            self.nonces.add(key)
        self.values[key] = value
        return True

    async def exists(self, key: str) -> int:
        return int(key in self.values)

    async def eval(self, *args):
        del args
        self.rate_calls += 1
        return [int(self.rate_calls <= self.rate_limit), 0]


async def collect_response(asgi_app, scope: dict, body: bytes = b"") -> list[dict]:
    messages: list[dict] = []
    sent = False

    async def receive() -> dict:
        nonlocal sent
        if sent:
            return {"type": "http.disconnect"}
        sent = True
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message: dict) -> None:
        messages.append(message)

    await asgi_app(scope, receive, send)
    return messages


def run_asgi(asgi_app, scope: dict, body: bytes = b"") -> list[dict]:
    return asyncio.run(collect_response(asgi_app, scope, body))


def scope_for(
    method: str,
    path: str,
    headers: list[tuple[bytes, bytes]] | None = None,
) -> dict:
    return {
        "type": "http",
        "method": method,
        "path": path,
        "raw_path": path.encode(),
        "headers": headers or [],
        "client": ("127.0.0.1", 50000),
        "state": {},
    }


def sign_request(method: str, path: str, timestamp: str, nonce: str, body: bytes) -> str:
    message = method.upper().encode() + path.encode() + timestamp.encode() + nonce.encode() + body
    return hmac.new(settings.secret_key.encode(), message, hashlib.sha256).hexdigest()


def signed_headers(
    method: str,
    path: str,
    body: bytes,
    timestamp: str | None = None,
) -> list[tuple[bytes, bytes]]:
    timestamp = timestamp or str(time.time())
    nonce = uuid4().hex
    signature = sign_request(method, path, timestamp, nonce, body)
    return [
        (b"x-timestamp", timestamp.encode()),
        (b"x-nonce", nonce.encode()),
        (b"x-signature", signature.encode()),
    ]


def make_token(role: str = "applicant", user_id: str | None = None, jti: str | None = None) -> str:
    now = datetime.now(UTC)
    claims = {
        "sub": user_id or str(uuid4()),
        "role": role,
        "jti": jti or uuid4().hex,
        "token_version": 0,
        "iat": now,
        "exp": now + timedelta(minutes=15),
    }
    return jwt.encode(claims, settings.secret_key, algorithm=settings.jwt_algorithm)


@pytest.fixture
def client() -> TestClient:
    try:
        from app.main import app
    except OSError as exc:
        pytest.skip(f"FastAPI app dependencies unavailable in this environment: {exc}")
    return TestClient(app)


def test_layer1_defensive_headers_on_health(client: TestClient) -> None:
    response = client.get("/health")

    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "max-age=31536000" in response.headers["strict-transport-security"]
    assert response.headers["content-security-policy"] == "default-src 'self'"


def test_layer1_missing_hmac_is_rejected(client: TestClient) -> None:
    response = client.post("/api/scheme/calculate", json={"margin": 10_000})

    assert response.status_code in {400, 401}


def test_layer1_stale_hmac_timestamp_is_rejected() -> None:
    redis = FakeRedis()

    async def downstream(scope, receive, send):
        del scope, receive
        await _ok_response(send)

    middleware = Layer1HMACMiddleware(downstream, settings.secret_key, redis)
    body = b'{"margin":10000}'
    stale = str(time.time() - 121)
    headers = signed_headers("POST", "/api/scheme/calculate", body, stale)

    messages = run_asgi(middleware, scope_for("POST", "/api/scheme/calculate", headers), body)

    assert messages[0]["status"] == 401


def test_layer1_valid_hmac_passes_gateway_validation() -> None:
    redis = FakeRedis()
    middleware = Layer1HMACMiddleware(_ok_response_app, settings.secret_key, redis)
    body = b'{"margin":10000}'
    headers = signed_headers("POST", "/api/scheme/calculate", body)

    messages = run_asgi(middleware, scope_for("POST", "/api/scheme/calculate", headers), body)

    assert messages[0]["status"] == 200
    assert b"layer1-ok" in messages[1]["body"]


def test_layer1_login_rate_limit_returns_429_with_retry_after() -> None:
    redis = FakeRedis()
    middleware = Layer1RateLimitMiddleware(_ok_response_app, redis)
    scope = scope_for("POST", "/auth/token")

    responses = [run_asgi(middleware, scope) for _ in range(6)]

    assert responses[-1][0]["status"] == 429
    assert (b"retry-after", b"60") in responses[-1][0]["headers"]


def test_layer2_unauthenticated_protected_endpoint(client: TestClient) -> None:
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


@pytest.mark.asyncio
async def test_layer2_revoked_token_rejected() -> None:
    redis = FakeRedis()
    jti = uuid4().hex
    token = make_token(jti=jti)
    await revoke_token(redis, jti, 900)

    with pytest.raises(ValueError, match="revoked"):
        await decode_active_token(token, settings.secret_key, settings.jwt_algorithm, redis)


def test_layer2_rbac_rejects_applicant_for_staff_role() -> None:
    dependency = RequireRole(["dic_officer", "sca_auditor"])
    request = Request(scope_for("GET", "/api/audit/logs"))
    request.state.identity = {"user_id": str(uuid4()), "role": "applicant"}

    with pytest.raises(Exception, match="Insufficient permissions"):
        dependency(request)


def test_layer2_asgi_state_injection() -> None:
    redis = FakeRedis()
    user_id = str(uuid4())
    token = make_token(user_id=user_id)
    captured: dict = {}

    async def downstream(scope, receive, send):
        del receive
        captured.update(scope["state"])
        await _ok_response(send, b"state-ok")

    middleware = Layer2AuthMiddleware(
        downstream,
        settings.secret_key,
        settings.jwt_algorithm,
        redis,
    )
    scope = scope_for("GET", "/protected", [(b"authorization", f"Bearer {token}".encode())])

    messages = run_asgi(middleware, scope)

    assert messages[0]["status"] == 200
    assert captured["identity"]["user_id"] == user_id
    assert captured["identity"]["role"] == "applicant"


def test_business_route_math_is_unchanged_with_both_layers() -> None:
    redis = FakeRedis()
    margin = 10_000.0
    body = json.dumps({"margin": margin}).encode()
    token = make_token()
    path = "/api/scheme/calculate"
    headers = signed_headers("POST", path, body)
    headers.append((b"authorization", f"Bearer {token}".encode()))
    captured: dict = {}

    async def business_route(scope, receive, send):
        captured["identity"] = scope["state"]["identity"]
        request = await receive()
        result = calculate_scheme(SchemeCalculateIn.model_validate(json.loads(request["body"])))
        response = json.dumps(result.model_dump(), default=str).encode()
        await send({"type": "http.response.start", "status": 200, "headers": []})
        await send({"type": "http.response.body", "body": response})

    layered = Layer1HMACMiddleware(
        Layer2AuthMiddleware(business_route, settings.secret_key, settings.jwt_algorithm, redis),
        settings.secret_key,
        redis,
    )
    messages = run_asgi(layered, scope_for("POST", path, headers), body)
    actual = json.loads(messages[1]["body"])
    expected = calculate_scheme(SchemeCalculateIn(margin=margin)).model_dump()

    assert messages[0]["status"] == 200
    assert captured["identity"]["role"] == "applicant"
    assert actual == json.loads(json.dumps(expected, default=str))


def test_layer3_correlation_id_is_generated_and_returned() -> None:
    captured: dict = {}

    async def downstream(scope, receive, send):
        del receive
        captured.update(scope["state"])
        await _ok_response(send, b"correlated")

    messages = run_asgi(
        CorrelationIDMiddleware(downstream),
        scope_for("GET", "/api/scheme/rules"),
    )
    response_headers = dict(messages[0]["headers"])

    assert "correlation_id" in captured
    assert response_headers[b"x-correlation-id"].decode() == captured["correlation_id"]


def test_layer3_correlation_id_is_preserved() -> None:
    correlation_id = str(uuid4())
    captured: dict = {}

    async def downstream(scope, receive, send):
        del receive
        captured.update(scope["state"])
        await _ok_response(send)

    messages = run_asgi(
        CorrelationIDMiddleware(downstream),
        scope_for("GET", "/health", [(b"x-correlation-id", correlation_id.encode())]),
    )

    assert captured["correlation_id"] == correlation_id
    assert dict(messages[0]["headers"])[b"x-correlation-id"].decode() == correlation_id


def test_layer3_unknown_path_is_denied() -> None:
    messages = run_asgi(Layer3BoundaryMiddleware(_ok_response_app), scope_for("GET", "/unknown"))

    assert messages[0]["status"] == 403
    assert b"not authorized" in messages[1]["body"]


def test_layer3_known_api_path_delegates() -> None:
    messages = run_asgi(Layer3BoundaryMiddleware(_ok_response_app), scope_for("GET", "/api/new"))

    assert messages[0]["status"] == 200


def test_layer3_exception_response_is_sanitized() -> None:
    from fastapi import FastAPI

    app = FastAPI()
    app.state.debug = False
    request = Request(
        {
            **scope_for("GET", "/failure"),
            "app": app,
            "state": {"correlation_id": "test-correlation"},
        }
    )

    response = asyncio.run(
        sanitized_exception_handler(request, RuntimeError("secret SQL details"))
    )
    payload = json.loads(response.body)

    assert response.status_code == 500
    assert payload == {
        "detail": "Internal server error",
        "correlation_id": "test-correlation",
    }
    assert "secret SQL details" not in response.body.decode()


class BoundaryPayload(StrictBoundaryModel):
    name: str


def test_layer3_strict_validation_rejects_extra_fields_and_unsafe_text() -> None:
    with pytest.raises(ValueError):
        BoundaryPayload.model_validate({"name": "valid", "unexpected": True})
    with pytest.raises(ValueError, match="unsafe markup"):
        sanitize_text("<script>alert(1)</script>")


def test_layer3_numeric_validation_is_strict_and_bounded() -> None:
    assert bounded_int(3, minimum=1, maximum=5) == 3
    assert bounded_float(2.5, minimum=1, maximum=3) == 2.5
    with pytest.raises(ValueError):
        bounded_int(True, minimum=0, maximum=1)
    with pytest.raises(ValueError):
        bounded_float(float("inf"), minimum=0, maximum=10)


def test_layer4_encrypts_and_decrypts_with_unique_envelopes() -> None:
    first = encrypt_field("restricted-value")
    second = encrypt_field("restricted-value")

    assert first != second
    assert decrypt_field(first) == "restricted-value"
    assert decrypt_field(second) == "restricted-value"


def test_layer4_rejects_tampered_ciphertext() -> None:
    import base64

    envelope = encrypt_field("tamper-resistant")
    raw_envelope = bytearray(
        base64.urlsafe_b64decode(envelope + "=" * (-len(envelope) % 4))
    )
    raw_envelope[-1] ^= 1
    tampered = base64.urlsafe_b64encode(raw_envelope).decode().rstrip("=")

    with pytest.raises(ValueError, match="Invalid or unauthenticated"):
        decrypt_field(tampered)


@pytest.mark.asyncio
async def test_layer4_sets_and_clears_transaction_local_rls_context() -> None:
    session = AsyncMock()

    await set_rls_context(session, user_id=uuid4(), role="applicant")
    await clear_rls_context(session)

    assert session.execute.await_count == 4
    statements = [call.args[0].text for call in session.execute.await_args_list]
    assert statements[:2] == [
        "SELECT set_config('app.user_id', :user_id, true)",
        "SELECT set_config('app.role', :role, true)",
    ]
    assert statements[2:] == [
        "SELECT set_config('app.user_id', '', true)",
        "SELECT set_config('app.role', '', true)",
    ]
    assert "ALTER TABLE dpr_records ENABLE ROW LEVEL SECURITY" in RLS_POLICY_SQL


def test_layer4_setup_registers_kms_and_rls_helpers() -> None:
    from fastapi import FastAPI

    app = FastAPI()
    setup_layer4_security(app)

    assert hasattr(app.state, "layer4_kms")
    assert app.state.set_rls_context is set_rls_context
    assert app.state.clear_rls_context is clear_rls_context


async def _ok_response(send: Callable[[dict], Awaitable[None]], body: bytes = b"layer1-ok") -> None:
    await send({"type": "http.response.start", "status": 200, "headers": []})
    await send({"type": "http.response.body", "body": body})


async def _ok_response_app(scope, receive, send) -> None:
    del scope, receive
    await _ok_response(send)
