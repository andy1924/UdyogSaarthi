"""Field-level AES-256-GCM envelope encryption for sensitive data."""

from __future__ import annotations

import base64
import binascii
import hashlib
import json
import secrets
from dataclasses import dataclass
from typing import Protocol

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings

_NONCE_SIZE = 12
_KEY_SIZE = 32
_FORMAT_VERSION = 1


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


class KMS(Protocol):
    """Minimal KMS contract; production implementations should call a real KMS."""

    def wrap_key(self, dek: bytes) -> dict[str, str]: ...

    def unwrap_key(self, wrapped: dict[str, str]) -> bytes: ...


@dataclass(frozen=True)
class LocalKMS:
    """Development adapter using a high-entropy application KEK.

    This adapter keeps the KEK separate from per-field DEKs, but production must
    replace it with a managed KMS/HSM implementation and never use a source-level
    secret as the long-term KEK.
    """

    kek: bytes
    key_id: str = "local-development-kek-v1"

    def __post_init__(self) -> None:
        if len(self.kek) != _KEY_SIZE:
            raise ValueError("KEK must be exactly 32 bytes")

    def wrap_key(self, dek: bytes) -> dict[str, str]:
        nonce = secrets.token_bytes(_NONCE_SIZE)
        wrapped = AESGCM(self.kek).encrypt(nonce, dek, self.key_id.encode())
        return {
            "key_id": self.key_id,
            "nonce": _b64encode(nonce),
            "ciphertext": _b64encode(wrapped),
        }

    def unwrap_key(self, wrapped: dict[str, str]) -> bytes:
        if wrapped.get("key_id") != self.key_id:
            raise ValueError("Unknown KEK identifier")
        return AESGCM(self.kek).decrypt(
            _b64decode(wrapped["nonce"]),
            _b64decode(wrapped["ciphertext"]),
            self.key_id.encode(),
        )


def default_kms() -> LocalKMS:
    """Build the development adapter from the configured secret key."""
    kek = hashlib.sha256(settings.secret_key.encode("utf-8")).digest()
    return LocalKMS(kek=kek)


def encrypt_field(plaintext: str, *, kms: KMS | None = None) -> str:
    """Encrypt a UTF-8 field and return a versioned URL-safe envelope string."""
    if not isinstance(plaintext, str):
        raise TypeError("plaintext must be a string")
    manager = kms or default_kms()
    dek = AESGCM.generate_key(bit_length=256)
    data_nonce = secrets.token_bytes(_NONCE_SIZE)
    ciphertext = AESGCM(dek).encrypt(data_nonce, plaintext.encode("utf-8"), None)
    envelope = {
        "v": _FORMAT_VERSION,
        "alg": "AES-256-GCM",
        "data_nonce": _b64encode(data_nonce),
        "ciphertext": _b64encode(ciphertext),
        "wrapped_dek": manager.wrap_key(dek),
    }
    return _b64encode(json.dumps(envelope, separators=(",", ":")).encode("utf-8"))


def decrypt_field(ciphertext: str, *, kms: KMS | None = None) -> str:
    """Decrypt and authenticate a field envelope."""
    if not isinstance(ciphertext, str):
        raise TypeError("ciphertext must be a string")
    try:
        envelope = json.loads(_b64decode(ciphertext))
        if envelope.get("v") != _FORMAT_VERSION or envelope.get("alg") != "AES-256-GCM":
            raise ValueError("Unsupported encryption envelope")
        manager = kms or default_kms()
        dek = manager.unwrap_key(envelope["wrapped_dek"])
        plaintext = AESGCM(dek).decrypt(
            _b64decode(envelope["data_nonce"]),
            _b64decode(envelope["ciphertext"]),
            None,
        )
        return plaintext.decode("utf-8")
    except (
        binascii.Error,
        InvalidTag,
        KeyError,
        TypeError,
        ValueError,
        json.JSONDecodeError,
    ) as exc:
        raise ValueError("Invalid or unauthenticated encrypted field") from exc


__all__ = ["KMS", "LocalKMS", "decrypt_field", "default_kms", "encrypt_field"]
