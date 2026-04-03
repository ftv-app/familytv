"""Tests for POST /embed endpoint."""

import pytest
from fastapi.testclient import TestClient


class TestEmbedEndpoint:
    """Test cases for POST /embed."""

    def test_embed_single_text(self, client: TestClient) -> None:
        """Single text returns one embedding vector."""
        response = client.post(
            "/embed/",
            json={"texts": ["hello world"], "family_id": "f1"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "embeddings" in data
        assert len(data["embeddings"]) == 1
        assert len(data["embeddings"][0]) == 384  # bge-small dimension
        assert data["model"] == "BAAI/bge-small-en-v1.5"
        assert data["dimension"] == 384

    def test_embed_multiple_texts(self, client: TestClient) -> None:
        """Multiple texts return corresponding number of embedding vectors."""
        texts = ["sunset at the beach", "birthday party", "kids playing"]
        response = client.post(
            "/embed/",
            json={"texts": texts, "family_id": "f1"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["embeddings"]) == 3
        for emb in data["embeddings"]:
            assert len(emb) == 384

    def test_embed_missing_family_id(self, client: TestClient) -> None:
        """Request without family_id returns 422."""
        response = client.post(
            "/embed/",
            json={"texts": ["test"]},
        )
        assert response.status_code == 422

    def test_embed_empty_texts(self, client: TestClient) -> None:
        """Empty texts list returns 422."""
        response = client.post(
            "/embed/",
            json={"texts": [], "family_id": "f1"},
        )
        assert response.status_code == 422

    def test_embed_same_text_deterministic(self, client: TestClient) -> None:
        """Same text should produce identical (normalized) embeddings."""
        payload = {"texts": ["consistent text"], "family_id": "f1"}
        r1 = client.post("/embed/", json=payload)
        r2 = client.post("/embed/", json=payload)
        assert r1.json()["embeddings"][0] == r2.json()["embeddings"][0]
