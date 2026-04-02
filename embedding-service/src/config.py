"""Environment configuration for the embedding service."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Model configuration
    MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIM: int = 384  # bge-small-en-v1.5 output dimension

    # LanceDB configuration
    LANCE_DB_PATH: str = "/tmp/familytv_vectors"

    # Server configuration
    PORT: int = 8080
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "info"

    # Performance tuning
    MAX_BATCH_SIZE: int = 32
    REQUEST_TIMEOUT_SECONDS: int = 30


settings = Settings()
