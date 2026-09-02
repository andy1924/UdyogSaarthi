"""Celery application instance for UdyogSaarthi background workers.

Queue strategy (3 queues):
  ``default``  — fast tasks: cache warm-up, state notifications
  ``pdf``      — WeasyPrint rendering (CPU-bound, limited concurrency)
  ``ai``       — OpenAI / ChromaDB RAG calls (IO-bound, rate-limited)

All queues share the same Redis broker (DB 1) and result backend (DB 2)
so they are isolated from the application's session cache (DB 0).

Worker startup command examples:
  # All queues, 4 workers total
  celery -A app.worker.celery_app worker -Q default,pdf,ai -c 4 --loglevel=info

  # PDF-only with concurrency 1 (WeasyPrint is not thread-safe under load)
  celery -A app.worker.celery_app worker -Q pdf -c 1 --loglevel=info

  # AI-only with concurrency 2 (respect OpenAI rate limits)
  celery -A app.worker.celery_app worker -Q ai -c 2 --loglevel=info
"""

from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "udyogsaarthi",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    # Auto-discover tasks in the tasks sub-package.
    include=[
        "app.worker.tasks.pdf_tasks",
        "app.worker.tasks.geo_tasks",
        "app.worker.tasks.rag_tasks",
    ],
)

# ── Serialisation ────────────────────────────────────────────────────
# Use JSON only — never allow pickle (security risk).
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]

# ── Result expiry ────────────────────────────────────────────────────
# Keep results for 1 hour; after that they are garbage-collected.
celery_app.conf.result_expires = 3600

# ── Queue routing ────────────────────────────────────────────────────
celery_app.conf.task_routes = {
    "app.worker.tasks.pdf_tasks.*": {"queue": "pdf"},
    "app.worker.tasks.rag_tasks.*": {"queue": "ai"},
    "app.worker.tasks.geo_tasks.*": {"queue": "default"},
}

# ── Reliability ──────────────────────────────────────────────────────
# Acknowledge tasks only after they complete (not on receipt).
# This ensures a worker crash does not silently drop tasks.
celery_app.conf.task_acks_late = True

# Re-queue tasks on worker failure (combined with acks_late).
celery_app.conf.task_reject_on_worker_lost = True

# Retry connection to broker on startup (avoid immediate crash if Redis is slow).
celery_app.conf.broker_connection_retry_on_startup = True

# ── Time limits ──────────────────────────────────────────────────────
# PDF generation hard limit: 5 min.
# AI calls hard limit: 2 min.
celery_app.conf.task_time_limit = 300
celery_app.conf.task_soft_time_limit = 240

# ── Worker settings ──────────────────────────────────────────────────
celery_app.conf.worker_prefetch_multiplier = 1  # one task at a time per worker slot
celery_app.conf.worker_max_tasks_per_child = 50  # restart after 50 tasks (memory leak guard)
