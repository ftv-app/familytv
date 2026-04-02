"""Locust load test script for FamilyTV Embedding Service.

Run with:
    locust -f scripts/load_test.py --host=http://localhost:8080

Or headless:
    locust -f scripts/load_test.py --host=http://localhost:8080 \
        --headless -u 50 -r 10 -t 60s --csv=results
"""

import random
import string
from locust import HttpUser, task


def random_family_id() -> str:
    return "loadtest_" + "".join(random.choices(string.ascii_lowercase, k=6))


class EmbeddingServiceUser(HttpUser):
    """Simulate a client hitting the embedding service endpoints."""

    @task(3)
    def embed_text(self) -> None:
        """Embed 1–5 texts. Weighted 3x because it's the most common operation."""
        texts = [
            " ".join(random.choices(string.ascii_lowercase, k=random.randint(3, 10)))
            for _ in range(random.randint(1, 5))
        ]
        self.client.post(
            "/embed/",
            json={"texts": texts, "family_id": random_family_id()},
            name="/embed",
        )

    @task(2)
    def index_item(self) -> None:
        """Index a single photo/video item."""
        self.client.post(
            "/index",
            json={
                "items": [
                    {
                        "id": f"photo_{random.randint(1_000_000, 9_999_999)}",
                        "text": " ".join(
                            random.choices(string.ascii_lowercase, k=random.randint(5, 15))
                        ),
                        "family_id": random_family_id(),
                        "type": random.choice(["photo", "video"]),
                    }
                ]
            },
            name="/index",
        )

    @task(1)
    def search(self) -> None:
        """Run a hybrid search query."""
        self.client.post(
            "/search",
            json={
                "query": " ".join(
                    random.choices(string.ascii_lowercase, k=random.randint(1, 4))
                ),
                "family_id": random_family_id(),
                "limit": random.randint(5, 20),
            },
            name="/search",
        )

    @task(1)
    def health(self) -> None:
        """Hit the health endpoint."""
        self.client.get("/health", name="/health")
