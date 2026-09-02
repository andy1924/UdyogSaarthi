"""
Async-safe PDF rendering service for DPR documents.

Uses Jinja2 for HTML templating and WeasyPrint for CSS Paged Media → PDF
compilation.  WeasyPrint is synchronous, so the blocking call is wrapped
in ``asyncio.to_thread()`` to keep the event loop responsive.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

import jinja2
import weasyprint

from app.core.config import settings

logger = logging.getLogger("udyogsaarthi.pdf_service")

# ── Template setup ───────────────────────────────────────────────────

_TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"

_jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=jinja2.select_autoescape(["html"]),
    undefined=jinja2.Undefined,  # silently render missing vars as empty
)


# ── Synchronous renderer (called inside thread) ─────────────────────


def _render_pdf_sync(
    dpr_id: str,
    dpr_payload: dict,
    output_path: str,
) -> str:
    """
    Render a DPR HTML template to a PDF file.

    This is a **blocking** call; use :func:`generate_dpr_pdf` for the
    async-safe wrapper.

    Returns the absolute path to the generated PDF.
    """
    template = _jinja_env.get_template("dpr_report.html")

    generated_at = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")

    html_string = template.render(
        dpr_id=dpr_id,
        data=dpr_payload,
        generated_at=generated_at,
    )

    doc = weasyprint.HTML(string=html_string)
    doc.write_pdf(output_path)

    logger.info("PDF generated: %s", output_path)
    return output_path


# ── Public async API ─────────────────────────────────────────────────


async def generate_dpr_pdf(
    dpr_id: str,
    dpr_payload: dict,
    output_dir: str | None = None,
) -> str:
    """
    Generate a DPR PDF asynchronously.

    Parameters
    ----------
    dpr_id:
        Unique document identifier (e.g. ``DPR-A1B2C3D4``).
    dpr_payload:
        Full 7-section data payload assembled by the DPR router.
    output_dir:
        Directory for generated PDFs.  Defaults to
        ``settings.dpr_output_dir``.

    Returns
    -------
    str
        Absolute filesystem path to the generated ``.pdf`` file.
    """
    out_dir = Path(output_dir or settings.dpr_output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    output_path = str(out_dir / f"{dpr_id}.pdf")

    try:
        result = await asyncio.to_thread(
            _render_pdf_sync,
            dpr_id,
            dpr_payload,
            output_path,
        )
        return result

    except Exception as exc:
        logger.error("PDF generation failed for %s: %s", dpr_id, exc)
        # Re-raise so the router can decide how to handle it
        raise
