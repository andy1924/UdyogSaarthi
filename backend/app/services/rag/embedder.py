"""ChromaDB bootstrap and knowledge-base seeding.

Documents are stored in ``app/services/rag/knowledge/`` as Markdown files.
Each file is chunked by heading (## sections) so retrieval is precise.

On first run, ``seed_knowledge_base()`` embeds all documents.
Subsequent runs are no-ops unless ``force_reseed=True`` is passed.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

from app.core.config import settings

logger = logging.getLogger("udyogsaarthi.rag.embedder")

_KNOWLEDGE_DIR = Path(__file__).resolve().parent / "knowledge"


def _get_collection():
    """Return the ChromaDB collection, creating it if necessary.

    Imports chromadb lazily so the module can be imported without chromadb
    installed (the rest of the API does not require it).
    """
    import chromadb
    from chromadb.utils import embedding_functions

    client = chromadb.PersistentClient(path=settings.chromadb_path)

    # Use OpenAI embeddings when available; fall back to the default
    # sentence-transformers model bundled with chromadb.
    if settings.openai_api_key:
        ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=settings.openai_api_key,
            model_name="text-embedding-3-small",
        )
    else:
        ef = embedding_functions.DefaultEmbeddingFunction()

    collection = client.get_or_create_collection(
        name=settings.chromadb_collection,
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )
    return collection


def _chunk_markdown(text: str, source: str) -> list[dict[str, Any]]:
    """Split a Markdown document into section chunks by H2 headings.

    Each chunk is a dict: ``{id, document, metadata}``.
    """
    chunks: list[dict[str, Any]] = []
    # Split on ## headings (H2) — preserve the heading in the chunk.
    sections = re.split(r"\n(?=## )", text.strip())
    for idx, section in enumerate(sections):
        if not section.strip():
            continue
        heading_match = re.match(r"^##\s+(.+)", section)
        heading = heading_match.group(1).strip() if heading_match else f"section_{idx}"
        chunk_id = f"{source}::{heading.lower().replace(' ', '_')}"
        chunks.append({
            "id": chunk_id,
            "document": section.strip(),
            "metadata": {
                "source": source,
                "heading": heading,
            },
        })
    return chunks


def seed_knowledge_base(force_reseed: bool = False) -> dict[str, int]:
    """Embed all knowledge documents into ChromaDB.

    Parameters
    ----------
    force_reseed:
        If ``True``, delete and re-embed all documents.
        If ``False`` (default), skip documents whose IDs already exist.

    Returns
    -------
    dict
        Summary with keys ``seeded``, ``skipped``, ``errors``.
    """
    collection = _get_collection()
    existing_ids: set[str] = set()

    if not force_reseed:
        try:
            existing = collection.get(include=[])
            existing_ids = set(existing.get("ids", []))
        except Exception as exc:
            logger.warning("Could not fetch existing IDs: %s", exc)

    seeded, skipped, errors = 0, 0, 0

    for md_file in sorted(_KNOWLEDGE_DIR.glob("*.md")):
        source = md_file.stem
        try:
            text = md_file.read_text(encoding="utf-8")
            chunks = _chunk_markdown(text, source)

            # Filter to chunks not yet in collection (unless force_reseed)
            new_chunks = [c for c in chunks if force_reseed or c["id"] not in existing_ids]

            if not new_chunks:
                skipped += len(chunks)
                continue

            collection.upsert(
                ids=[c["id"] for c in new_chunks],
                documents=[c["document"] for c in new_chunks],
                metadatas=[c["metadata"] for c in new_chunks],
            )
            seeded += len(new_chunks)
            skipped += len(chunks) - len(new_chunks)
            logger.info("[embedder] %s: seeded %d chunks", source, len(new_chunks))

        except Exception as exc:
            logger.error("[embedder] Failed to seed %s: %s", md_file, exc)
            errors += 1

    return {"seeded": seeded, "skipped": skipped, "errors": errors}


def query_collection(query_text: str, n_results: int = 5) -> list[dict[str, Any]]:
    """Retrieve the top-n most relevant chunks for *query_text*.

    Returns a list of dicts: ``{document, metadata, distance}``.
    """
    collection = _get_collection()
    try:
        results = collection.query(
            query_texts=[query_text],
            n_results=min(n_results, collection.count() or 1),
            include=["documents", "metadatas", "distances"],
        )
        chunks = []
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]
        for doc, meta, dist in zip(docs, metas, dists):
            chunks.append({"document": doc, "metadata": meta, "distance": dist})
        return chunks
    except Exception as exc:
        logger.error("[embedder] Query failed: %s", exc)
        return []
