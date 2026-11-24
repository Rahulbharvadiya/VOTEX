"""Sanitizer service for scrubbing secrets, internal paths, and provider names."""

import os
import re
from typing import Any, Dict, List, Union
from votex_api.logging_config import redact_secrets, scrub_vendor_branding

_SENSITIVE_KEY_PATTERN = re.compile(r"(key|secret|token|password|auth)", re.IGNORECASE)


def sanitize_text(text: str) -> str:
    """Sanitize arbitrary string text."""
    if not text:
        return text
    return scrub_vendor_branding(redact_secrets(str(text)))


def sanitize_payload(data: Any) -> Any:
    """Recursively sanitize dicts, lists, and strings for safe API response."""
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if _SENSITIVE_KEY_PATTERN.search(str(k)):
                sanitized[k] = "***REDACTED***"
            else:
                sanitized[k] = sanitize_payload(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_payload(v) for v in data]
    elif isinstance(data, str):
        return sanitize_text(data)
    return data
