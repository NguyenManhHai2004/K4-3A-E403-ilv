from __future__ import annotations

import json
from typing import Any

from .common import SUPPORTED_LANGUAGES, normalize_citations, require_non_empty


def serialize_flashcards(
    *,
    title: str,
    language: str,
    covered_until: str,
    instructions: str,
    flashcards: list[dict[str, Any]] | None,
) -> tuple[str, int, list[str]]:
    if not flashcards:
        raise ValueError("flashcards is required for flashcard generation")

    normalized_cards: list[dict[str, Any]] = []
    all_citations: list[str] = []
    for index, card in enumerate(flashcards, start=1):
        front = require_non_empty(str(card.get("front", "")), f"flashcards[{index}].front")
        back = require_non_empty(str(card.get("back", "")), f"flashcards[{index}].back")
        citations = normalize_citations(card.get("citations"))
        normalized_cards.append({
            "front": front,
            "back": back,
            "citations": citations,
        })
        all_citations.extend(citations)

    content = {
        "type": "flashcard",
        "title": title,
        "language": language,
        "covered_until": covered_until,
        "instructions": instructions,
        "items": normalized_cards,
    }
    return json.dumps(content, ensure_ascii=False, indent=2), len(normalized_cards), normalize_citations(all_citations)


def generate_flashcard(
    title: str,
    flashcards: list[dict[str, Any]] | None = None,
    language: str = "vi",
    covered_until: str = "",
    instructions: str = "",
    **kwargs: Any,
) -> dict[str, Any]:
    normalized_title = require_non_empty(title, "title")
    normalized_language = require_non_empty(language, "language")
    if normalized_language not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language: {normalized_language}")

    normalized_scope = str(covered_until).strip()
    normalized_instructions = instructions.strip()

    content, item_count, citations = serialize_flashcards(
        title=normalized_title,
        language=normalized_language,
        covered_until=normalized_scope,
        instructions=normalized_instructions,
        flashcards=flashcards,
    )

    return {
        "tool": "generate_flashcard",
        "material_type": "flashcard",
        "title": normalized_title,
        "language": normalized_language,
        "covered_until": normalized_scope,
        "content_format": "json",
        "content": content,
        "item_count": item_count,
        "citations": citations,
        "status": "success",
    }


generate_flashcards = generate_flashcard
