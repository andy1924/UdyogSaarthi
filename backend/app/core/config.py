from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/udyogsaarthi"
    redis_url: str = "redis://localhost:6379/0"
    debug: bool = False
    app_env: str = "development"

    # ── Geo / Feasibility engine ──────────────────────────────────────
    mappls_rest_key: str = ""
    overpass_api_url: str = "https://overpass-api.de/api/interpreter"

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
