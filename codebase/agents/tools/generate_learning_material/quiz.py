from __future__ import annotations

import json
from typing import Any

from .common import SUPPORTED_LANGUAGES, normalize_citations, require_non_empty


def serialize_quiz(
    *,
    title: str,
    language: str,
    covered_until: str,
    instructions: str,
    quiz_items: list[dict[str, Any]] | None,
) -> tuple[str, int, list[str]]:
    if not quiz_items:
        raise ValueError("quiz_items is required for quiz generation")

    normalized_items: list[dict[str, Any]] = []
    all_citations: list[str] = []
    for index, item in enumerate(quiz_items, start=1):
        question = require_non_empty(str(item.get("question", "")), f"quiz_items[{index}].question")
        options = [str(option).strip() for option in item.get("options", []) if str(option).strip()]
        if len(options) < 2:
            raise ValueError(f"quiz_items[{index}].options must contain at least 2 items")
        correct_option = require_non_empty(
            str(item.get("correct_option", "")),
            f"quiz_items[{index}].correct_option",
        )
        if correct_option not in options:
            raise ValueError(f"quiz_items[{index}].correct_option must match one of the provided options")
        explanation = require_non_empty(
            str(item.get("explanation", "")),
            f"quiz_items[{index}].explanation",
        )
        citations = normalize_citations(item.get("citations"))
        normalized_items.append({
            "question": question,
            "options": options,
            "correct_option": correct_option,
            "explanation": explanation,
            "citations": citations,
        })
        all_citations.extend(citations)

    content = {
        "type": "quiz",
        "title": title,
        "language": language,
        "covered_until": covered_until,
        "instructions": instructions,
        "items": normalized_items,
    }
    return json.dumps(content, ensure_ascii=False, indent=2), len(normalized_items), normalize_citations(all_citations)


def generate_quiz(
    title: str,
    quiz_items: list[dict[str, Any]] | None = None,
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

    content, item_count, citations = serialize_quiz(
        title=normalized_title,
        language=normalized_language,
        covered_until=normalized_scope,
        instructions=normalized_instructions,
        quiz_items=quiz_items,
    )

    return {
        "tool": "generate_quiz",
        "material_type": "quiz",
        "title": normalized_title,
        "language": normalized_language,
        "covered_until": normalized_scope,
        "content_format": "json",
        "content": content,
        "item_count": item_count,
        "citations": citations,
        "status": "success",
    }
