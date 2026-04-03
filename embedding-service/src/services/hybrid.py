"""Hybrid search: vector similarity + BM25 keyword matching via Reciprocal Rank Fusion."""

import math
import re
from collections import Counter
from typing import Any

from src.services.embedder import get_embedder
from src.services.vector_store import get_vector_store


# ─── BM25 (SPIMI-style, in-memory) ────────────────────────────────────────────


class BM25:
    """In-memory BM25 index for a fixed corpus.

    Lightweight reimplementation — sufficient for family-sized document sets
    (thousands of items per family, not millions).
    """

    AVGDL: float = 0.0
    _doc_lengths: list[int] = []
    _doc_freqs: dict[str, int] = {}
    _corpus_size: int = 0
    _corpus: list[str] = []

    K1: float = 1.5
    B: float = 0.75

    def index(self, documents: list[dict[str, Any]]) -> None:
        """Build BM25 index from a list of documents (already filtered by family_id)."""
        self._corpus = [doc["text"] for doc in documents]
        self._corpus_size = len(documents)
        self._doc_lengths = []
        self._doc_freqs = Counter()

        for doc_text in self._corpus:
            tokens = self._tokenize(doc_text)
            self._doc_lengths.append(len(tokens))
            unique_tokens = set(tokens)
            for token in unique_tokens:
                self._doc_freqs[token] += 1

        total_len = sum(self._doc_lengths)
        self.AVGDL = total_len / max(self._corpus_size, 1)

    def score(self, query: str) -> list[tuple[int, float]]:
        """Score all documents against a query. Returns list of (doc_idx, score)."""
        query_tokens = self._tokenize(query)
        scores: list[float] = [0.0] * self._corpus_size

        N = self._corpus_size
        idf: dict[str, float] = {}
        for token in query_tokens:
            df = self._doc_freqs.get(token, 0)
            # IDF with smoothing to avoid log(0)
            idf[token] = math.log((N - df + 0.5) / (df + 0.5) + 1)

        for i, doc_text in enumerate(self._corpus):
            tokens = self._tokenize(doc_text)
            doc_len = self._doc_lengths[i]
            tf = Counter(tokens)

            doc_score = 0.0
            for token in query_tokens:
                freq = tf.get(token, 0)
                numerator = freq * (self.K1 + 1)
                denominator = freq + self.K1 * (1 - self.B + self.B * doc_len / max(self.AVGDL, 1))
                doc_score += idf.get(token, 0) * (numerator / max(denominator, 1e-10))
            scores[i] = doc_score

        # Return sorted by score descending
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
        return [(idx, score) for idx, score in ranked if score > 0]

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        """Simple whitespace + lowercase tokenization."""
        return re.findall(r"\b\w+\b", text.lower())


# ─── Reciprocal Rank Fusion ───────────────────────────────────────────────────


def reciprocal_rank_fusion(
    vector_results: list[dict[str, Any]],
    bm25_results: list[tuple[int, float]],
    vector_docs: list[dict[str, Any]],
    k: int = 60,
) -> list[dict[str, Any]]:
    """Fuse vector and BM25 results using RRF.

    RRF score = sum(1 / (k + rank_i)) across result lists.
    Higher score = more relevant.
    """
    rrf_scores: dict[str, float] = {}

    # Add vector search scores
    for rank, doc in enumerate(vector_results):
        doc_id = doc["id"]
        score = 1.0 / (k + rank + 1)
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + score

    # Add BM25 scores (normalized)
    if bm25_results:
        max_bm25 = max(score for _, score in bm25_results) if bm25_results else 1.0
        for rank, (idx, score) in enumerate(bm25_results):
            doc_id = vector_docs[idx]["id"]
            norm_score = score / max_bm25 if max_bm25 > 0 else 0.0
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1)) * norm_score

    # Sort by RRF score descending
    sorted_ids = sorted(rrf_scores, key=rrf_scores.get, reverse=True)
    return [{"id": doc_id, "rrf_score": rrf_scores[doc_id]} for doc_id in sorted_ids]


# ─── Hybrid Search ────────────────────────────────────────────────────────────


def hybrid_search(
    query: str,
    family_id: str,
    limit: int = 10,
    type_filter: str | None = None,
) -> list[dict[str, Any]]:
    """Perform hybrid search combining vector similarity and BM25.

    1. Embed the query text.
    2. Run vector search on LanceDB (family_id filtered).
    3. Run BM25 search on in-memory indexed documents for the family.
    4. Fuse results with Reciprocal Rank Fusion.
    """
    # Step 1: embed query
    embedder = get_embedder()
    query_vector = embedder.encode([query])[0]

    # Step 2: vector search
    vs = get_vector_store()
    vector_results = vs.search(
        query_vector=query_vector,
        family_id=family_id,
        limit=limit * 2,  # Fetch extra to account for RRF reordering
        type_filter=type_filter,
    )

    if not vector_results:
        return []

    # Step 3: BM25 — index the retrieved documents in-memory
    # (Cheaper than indexing the whole family; good enough for RRF)
    # Build a mini-corpus from vector results for BM25
    corpus = [
        {"id": r["id"], "text": r["text"]}
        for r in vector_results
    ]
    bm25 = BM25()
    bm25.index(corpus)
    bm25_results = bm25.score(query)

    # Step 4: RRF fusion
    fused = reciprocal_rank_fusion(vector_results, bm25_results, corpus)

    # Merge scores back into original result objects
    score_map = {f["id"]: f["rrf_score"] for f in fused}
    results_with_score = []
    seen = set()
    for f in fused:
        doc_id = f["id"]
        if doc_id in seen:
            continue
        seen.add(doc_id)
        for r in vector_results:
            if r["id"] == doc_id:
                results_with_score.append({
                    "id": r["id"],
                    "text": r["text"],
                    "score": round(score_map[doc_id], 4),
                    "type": r.get("type"),
                })
                break

    return results_with_score[:limit]
