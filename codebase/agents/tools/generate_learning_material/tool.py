from __future__ import annotations

from typing import Any

from .common import SUPPORTED_LANGUAGES, normalize_citations, require_non_empty
from .flashcard import generate_flashcard, generate_flashcards, serialize_flashcards
from .mindmap import generate_mindmap, serialize_mindmap
from .quiz import generate_quiz, serialize_quiz

SUPPORTED_MATERIAL_TYPES = {"quiz", "flashcard", "mindmap"}


def generate_learning_material(
    material_type: str,
    title: str,
    language: str = "vi",
    covered_until: str = "",
    instructions: str = "",
    quiz_items: list[dict[str, Any]] | None = None,
    flashcards: list[dict[str, Any]] | None = None,
    mindmap: dict[str, Any] | None = None,
    **kwargs: Any,
) -> dict[str, Any]:
    normalized_type = require_non_empty(material_type, "material_type").lower()
    if normalized_type not in SUPPORTED_MATERIAL_TYPES:
        raise ValueError(f"Unsupported material_type: {normalized_type}")

    if normalized_type == "quiz":
        result = generate_quiz(
            title=title,
            quiz_items=quiz_items,
            language=language,
            covered_until=covered_until,
            instructions=instructions,
            **kwargs,
        )
    elif normalized_type == "flashcard":
        result = generate_flashcard(
            title=title,
            flashcards=flashcards,
            language=language,
            covered_until=covered_until,
            instructions=instructions,
            **kwargs,
        )
    else:
        result = generate_mindmap(
            title=title,
            mindmap=mindmap,
            language=language,
            covered_until=covered_until,
            instructions=instructions,
            **kwargs,
        )

    # Maintain tool name attribute as generate_learning_material if called directly
    result["tool"] = "generate_learning_material"
    return result


__all__ = [
    "generate_learning_material",
    "generate_quiz",
    "generate_flashcard",
    "generate_flashcards",
    "generate_mindmap",
    "serialize_quiz",
    "serialize_flashcards",
    "serialize_mindmap",
]
