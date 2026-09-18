from __future__ import annotations

from typing import Any

SUPPORTED_LANGUAGES = {"vi", "en"}


def require_non_empty(value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name} must not be empty")
    return normalized


def normalize_citations(raw: list[str] | None) -> list[str]:
    citations = [str(item).strip() for item in (raw or []) if str(item).strip()]
    return list(dict.fromkeys(citations))
