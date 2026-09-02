"""RAG knowledge base refresh task.

Runs in the ``ai`` queue. Re-embeds compliance knowledge documents into
ChromaDB when documents are updated.  On first run with an empty collection,
it seeds all documents automatically.

This task is typically triggered:
  - On Celery worker startup (via the beat schedule)
  - Manually by a DIC officer after uploading new guidelines
"""

from __future__ import annotations

import logging

from app.worker.celery_app import celery_app

logger = logging.getLogger("udyogsaarthi.worker.rag_tasks")


@celery_app.task(
    name="app.worker.tasks.rag_tasks.refresh_compliance_knowledge_task",
    queue="ai",
    ignore_result=False,
    max_retries=2,
    default_retry_delay=60,
    acks_late=True,
)
def refresh_compliance_knowledge_task() -> dict:
    """Re-seed or refresh the ChromaDB compliance knowledge base.

    Returns a summary dict: ``{seeded: int, skipped: int, errors: int}``.
    """
    # Avoid circular import — embedder imports chromadb which is heavy.
    from app.services.rag.embedder import seed_knowledge_base

    logger.info("[rag] Starting compliance knowledge refresh")
    try:
        summary = seed_knowledge_base(force_reseed=False)
        logger.info("[rag] Knowledge refresh complete: %s", summary)
        return summary
    except Exception as exc:
        logger.error("[rag] Knowledge refresh failed: %s", exc)
        raise
