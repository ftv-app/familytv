"""Tests for POST /search and POST /index endpoints."""

import pytest
from fastapi.testclient import TestClient


class TestIndexEndpoint:
    """Test cases for POST /index."""

    def test_index_single_item(self, client: TestClient) -> None:
        """Index one item and verify it is indexed."""
        response = client.post(
            "/index",
            json={
                "items": [
                    {
                        "id": "photo_001",
                        "text": "kids playing in the garden",
                        "family_id": "family_search_test",
                        "type": "photo",
                    }
                ]
            },
        )
        assert response.status_code == 200
        assert response.json()["indexed"] == 1

    def test_index_multiple_items(self, client: TestClient) -> None:
        """Index multiple items at once."""
        response = client.post(
            "/index",
            json={
                "items": [
                    {"id": "photo_002", "text": "beach sunset", "family_id": "f2", "type": "photo"},
                    {"id": "photo_003", "text": "birthday cake", "family_id": "f2", "type": "photo"},
                    {"id": "video_001", "text": "hiking trip", "family_id": "f2", "type": "video"},
                ]
            },
        )
        assert response.status_code == 200
        assert response.json()["indexed"] == 3


class TestSearchEndpoint:
    """Test cases for POST /search."""

    def test_search_returns_indexed_item(self, client: TestClient) -> None:
        """After indexing, search finds the item."""
        # Index a known item
        client.post(
            "/index",
            json={
                "items": [
                    {
                        "id": "search_photo_001",
                        "text": "sunset over the ocean waves",
                        "family_id": "family_search_001",
                        "type": "photo",
                    }
                ]
            },
        )

        # Search for it
        response = client.post(
            "/search",
            json={
                "query": "ocean sunset",
                "family_id": "family_search_001",
                "limit": 5,
            },
        )
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) >= 1
        assert results[0]["id"] == "search_photo_001"
        assert "score" in results[0]

    def test_search_requires_family_id(self, client: TestClient) -> None:
        """Search without family_id returns 422."""
        response = client.post(
            "/search",
            json={"query": "test", "limit": 5},
        )
        assert response.status_code == 422

    def test_search_family_isolation(self, client: TestClient) -> None:
        """Family A cannot see Family B's items."""
        # Index item for family_a
        client.post(
            "/index",
            json={
                "items": [
                    {
                        "id": "private_photo",
                        "text": "private family photo album",
                        "family_id": "family_a",
                        "type": "photo",
                    }
                ]
            },
        )

        # Search as family_b — should get no results
        response = client.post(
            "/search",
            json={
                "query": "private family photo album",
                "family_id": "family_b",
                "limit": 10,
            },
        )
        assert response.status_code == 200
        results = response.json()["results"]
        ids = [r["id"] for r in results]
        assert "private_photo" not in ids

    def test_search_limit(self, client: TestClient) -> None:
        """Search respects the limit parameter."""
        for i in range(5):
            client.post(
                "/index",
                json={
                    "items": [
                        {
                            "id": f"limit_test_{i}",
                            "text": f"test document number {i}",
                            "family_id": "family_limit_test",
                            "type": "photo",
                        }
                    ]
                },
            )

        response = client.post(
            "/search",
            json={
                "query": "test document",
                "family_id": "family_limit_test",
                "limit": 2,
            },
        )
        assert response.status_code == 200
        assert len(response.json()["results"]) <= 2

    def test_search_type_filter(self, client: TestClient) -> None:
        """Search with type filter only returns matching types."""
        for doc_type in ["photo", "video"]:
            client.post(
                "/index",
                json={
                    "items": [
                        {
                            "id": f"typed_doc_{doc_type}",
                            "text": "colorful sunset landscape",
                            "family_id": "family_type_test",
                            "type": doc_type,
                        }
                    ]
                },
            )

        response = client.post(
            "/search",
            json={
                "query": "sunset landscape",
                "family_id": "family_type_test",
                "limit": 10,
                "type": "photo",
            },
        )
        assert response.status_code == 200
        results = response.json()["results"]
        for r in results:
            assert r["type"] == "photo"


class TestHealthEndpoint:
    """Test cases for GET /health."""

    def test_health_returns_status(self, client: TestClient) -> None:
        """Health endpoint returns model name and vector count."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model"] == "BAAI/bge-small-en-v1.5"
        assert "vector_count" in data
        assert isinstance(data["vector_count"], int)
