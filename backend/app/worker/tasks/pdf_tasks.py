"""PDF generation background task.

Runs WeasyPrint inside the Celery ``pdf`` queue worker (synchronous process —
no asyncio event loop needed in Celery tasks).

After generating the PDF, the task updates the DPRRecord row in PostgreSQL
using a synchronous SQLAlchemy session so the database reflects the real
file path.

Retry strategy:
  - Up to 3 retries with 30-second backoff between attempts.
  - On permanent failure (max retries exceeded) the DPR record status is
    set to ``pdf_failed`` so the UI can surface an actionable error.
"""

from __future__ import annotations

import logging
from pathlib import Path

from celery import Task
from celery.exceptions import MaxRetriesExceededError
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.pdf_service import _render_pdf_sync
from app.worker.celery_app import celery_app

logger = logging.getLogger("udyogsaarthi.worker.pdf_tasks")

# Synchronous SQLAlchemy engine for Celery workers (no asyncpg in sync context).
_SYNC_DB_URL = settings.database_url.replace("+asyncpg", "+psycopg2").replace(
    "postgresql+psycopg2", "postgresql"
)


def _get_sync_engine():
    """Lazily create a synchronous SQLAlchemy engine for worker use."""
    return create_engine(
        _SYNC_DB_URL,
        pool_pre_ping=True,
        pool_size=2,
        max_overflow=4,
    )


class _BaseTask(Task):
    """Base task class that holds the DB engine as a class-level cache."""

    _engine = None

    @property
    def engine(self):
        if self._engine is None:
            self._engine = _get_sync_engine()
        return self._engine


@celery_app.task(
    bind=True,
    base=_BaseTask,
    name="app.worker.tasks.pdf_tasks.generate_dpr_pdf_task",
    queue="pdf",
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def generate_dpr_pdf_task(self: _BaseTask, dpr_id: str, dpr_payload: dict) -> str:
    """Generate a DPR PDF and persist the file path to the database.

    Parameters
    ----------
    dpr_id:
        Unique DPR identifier (e.g. ``DPR-A1B2C3D4``).
    dpr_payload:
        Full 7-section DPR data dict (JSON-serialisable).

    Returns
    -------
    str
        Absolute path to the generated PDF file.
    """

    logger.info("[pdf] Starting PDF generation for %s", dpr_id)

    out_dir = Path(settings.dpr_output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_path = str(out_dir / f"{dpr_id}.pdf")

    try:
        result_path = _render_pdf_sync(dpr_id, dpr_payload, output_path)
        logger.info("[pdf] PDF generated: %s", result_path)
    except Exception as exc:
        logger.warning("[pdf] PDF render failed for %s: %s — retrying", dpr_id, exc)
        try:
            raise self.retry(exc=exc)
        except MaxRetriesExceededError:
            logger.error("[pdf] Max retries exceeded for %s", dpr_id)
            _update_dpr_status(self.engine, dpr_id, pdf_path=None, status="pdf_failed")
            raise

    # Update the DPR record with the real PDF path.
    _update_dpr_status(self.engine, dpr_id, pdf_path=result_path, status="ready")
    logger.info("[pdf] DPRRecord %s updated with pdf_path=%s", dpr_id, result_path)
    return result_path


def _update_dpr_status(engine, dpr_id: str, pdf_path: str | None, status: str) -> None:
    """Update DPRRecord pdf_path and status synchronously."""
    from app.models.dpr import DPRRecord  # avoid circular at import time

    try:
        with Session(engine) as session:
            record = session.execute(
                select(DPRRecord).where(DPRRecord.id == dpr_id)
            ).scalar_one_or_none()
            if record:
                record.pdf_path = pdf_path
                record.status = status
                session.commit()
            else:
                logger.warning("[pdf] DPRRecord %s not found for status update", dpr_id)
    except Exception as exc:
        logger.error("[pdf] DB update failed for %s: %s", dpr_id, exc)
