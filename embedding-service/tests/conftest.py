"""Pytest fixtures for embedding service tests."""

import gc
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.config import Settings
from src.main import app


@pytest.fixture(scope="session")
def temp_db_path(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """Provide a unique temporary directory for LanceDB per test session."""
    return tmp_path_factory.mktemp("lancedb")


@pytest.fixture(scope="session")
def test_settings(temp_db_path: Path) -> Settings:
    """Override settings with a temporary database path."""
    original = Settings()
    # Monkey-patch module-level settings for the test session
    import src.config as config_module

    config_module.settings.LANCE_DB_PATH = str(temp_db_path)
    config_module.settings.MODEL_NAME = "BAAI/bge-small-en-v1.5"
    yield config_module.settings
    # Restore
    config_module.settings.LANCE_DB_PATH = original.LANCE_DB_PATH


@pytest.fixture(scope="module")
def client(test_settings: Settings) -> TestClient:
    """Provide a FastAPI TestClient with the app lifecycle fully exercised."""
    with TestClient(app, raise_server_exceptions=True) as client:
        yield client
    # Cleanup after module
    gc.collect()
