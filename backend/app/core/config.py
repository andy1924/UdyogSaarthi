from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRET = "change-me-in-production-udyogsaarthi-secret-key"


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/udyogsaarthi"
    redis_url: str = "redis://localhost:6379/0"
    debug: bool = False
    app_env: str = "development"
    secret_key: str = _DEFAULT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # ── PostgreSQL connection pool tuning ─────────────────────────────
    # pool_size: steady-state connections kept open per worker process.
    # max_overflow: extra connections allowed above pool_size under load.
    # pool_timeout: seconds to wait for a connection before raising.
    # pool_recycle: seconds before a connection is recycled (avoids stale TCP).
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800

    # ── Geo / Feasibility engine ──────────────────────────────────────
    mappls_rest_key: str = ""
    overpass_api_url: str = "https://overpass-api.de/api/interpreter"
    # Mappls REST v1 reverse-geocode base URL (append /{key}/rev_geocode at runtime)
    mappls_rev_geocode_url: str = "https://apis.mappls.com/advancedmaps/v1"
    # Data.gov.in CKAN resource ID for the LGD Block-level dataset
    # Known public ID: 9115b89c-b661-4d12-8a1c-6ef2dc81c7b5
    lgd_api_resource_id: str = "9115b89c-b661-4d12-8a1c-6ef2dc81c7b5"

    # ── DPR / AI SWOT & KYC ──────────────────────────────────────────
    openai_api_key: str = ""
    api_setu_bearer_token: str = "b9eb74c511abde7b0b0ebcec34d6b11b6b0fc35d"

    # ── PDF Rendering ────────────────────────────────────────────────
    dpr_output_dir: str = "./generated_dprs"

    # ── Celery / Background workers ───────────────────────────────────
    # Broker and result backend both use Redis (already in the stack).
    # celery_broker_url defaults to the same Redis as redis_url.
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    # Concurrency per Celery worker process (overridden per-queue in compose).
    celery_worker_concurrency: int = 4

    # ── Redis cache TTLs (seconds) ────────────────────────────────────
    cache_ttl_revgeo: int = 86_400        # Mappls reverse-geocode — 24 h
    cache_ttl_lgd: int = 604_800          # LGD API — 7 days
    cache_ttl_poi: int = 3_600            # POI count — 1 h
    cache_ttl_compliance: int = 43_200    # RAG compliance — 12 h
    # Version prefix for cache keys — bump to invalidate all cached data.
    cache_key_version: str = "v1"

    # ── RAG / ChromaDB ────────────────────────────────────────────────
    # Path where ChromaDB persists its on-disk vector store.
    chromadb_path: str = "./chromadb_store"
    # Collection name inside ChromaDB for compliance documents.
    chromadb_collection: str = "udyog_compliance"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def _validate_secret_key(self) -> "Settings":
        """Refuse to start in production if SECRET_KEY is still the insecure default."""
        if self.app_env == "production" and self.secret_key == _DEFAULT_SECRET:
            raise ValueError(
                "SECRET_KEY must be changed from the default value before running in production. "
                "Set the SECRET_KEY environment variable to a securely generated random string "
                "(e.g. `openssl rand -hex 32`)."
            )
        return self


settings = Settings()
