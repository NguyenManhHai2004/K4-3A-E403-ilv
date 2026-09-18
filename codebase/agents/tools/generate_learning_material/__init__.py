from __future__ import annotations

from .flashcard import generate_flashcard, generate_flashcards
from .mindmap import generate_mindmap
from .quiz import generate_quiz
from .tool import generate_learning_material

__all__ = [
    "generate_learning_material",
    "generate_quiz",
    "generate_flashcard",
    "generate_flashcards",
    "generate_mindmap",
]
