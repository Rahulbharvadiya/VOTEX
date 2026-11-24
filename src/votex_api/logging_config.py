"""Structured logging and secret filtering for VOTEX API."""

import logging
import re
import sys
from typing import Any, Dict


# Patterns to redact from logs and public outputs
_BEARER_PATTERN = re.compile(r"(Bearer\s+)[A-Za-z0-9_\-\.]+", re.IGNORECASE)
_KV_SECRET_PATTERN = re.compile(
    r"([a-z0-9_\-]*(?:key|secret|token|password)[a-z0-9_\-]*\s*[:=]\s*['\"])[^'\"]+(['\"])",
    re.IGNORECASE,
)


def redact_secrets(text: str) -> str:
    """Scrub sensitive credentials from string."""
    if not isinstance(text, str):
        return text
    result = _BEARER_PATTERN.sub(r"\1***REDACTED***", text)
    result = _KV_SECRET_PATTERN.sub(r"\1***REDACTED***\2", result)
    return result


def scrub_vendor_branding(text: str) -> str:
    """Replace provider name with neutral labels in customer-facing outputs."""
    if not isinstance(text, str):
        return text
    text = re.sub(r"\bBodhan Indic-Transcribe\b", "Indic-Transcribe", text, flags=re.IGNORECASE)
    text = re.sub(r"\bBodhan Indic-Translate\b", "Indic-Translate", text, flags=re.IGNORECASE)
    text = re.sub(r"\bBodhan Indic-Speak\b", "Indic-Speak", text, flags=re.IGNORECASE)
    text = re.sub(r"\bBodhan Indic-OCR\b", "Indic-OCR", text, flags=re.IGNORECASE)
    text = re.sub(r"\bBodhan AI\b", "VOTEX Engine", text, flags=re.IGNORECASE)
    text = re.sub(r"\bBodhan\b", "VOTEX", text, flags=re.IGNORECASE)
    return text


class SanitizingFormatter(logging.Formatter):
    """Logging formatter that redacts secrets and scrubs vendor names."""

    def format(self, record: logging.LogRecord) -> str:
        orig = super().format(record)
        return scrub_vendor_branding(redact_secrets(orig))


def setup_logging(level: int = logging.INFO) -> None:
    """Initialize root logger with security sanitizer."""
    handler = logging.StreamHandler(sys.stdout)
    formatter = SanitizingFormatter(
        "%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]
