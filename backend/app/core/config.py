from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/udyogsaarthi"
    redis_url: str = "redis://localhost:6379/0"
    debug: bool = False
    app_env: str = "development"
    secret_key: str = "change-me-in-production-udyogsaarthi-secret-key"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
