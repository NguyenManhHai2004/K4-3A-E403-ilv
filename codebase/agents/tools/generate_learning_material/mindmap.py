from __future__ import annotations

from typing import Any
from xml.etree.ElementTree import Element, SubElement, tostring

from .common import SUPPORTED_LANGUAGES, normalize_citations, require_non_empty


def _append_branch(parent: Element, node: dict[str, Any]) -> int:
    label = require_non_empty(str(node.get("label", "")), "mindmap branch label")
    branch_el = SubElement(parent, "branch", {"label": label})
    citations = normalize_citations(node.get("citations"))
    for citation in citations:
        citation_el = SubElement(branch_el, "citation")
        citation_el.text = citation

    count = 1
    for child in node.get("children", []) or []:
        count += _append_branch(branch_el, child)
    return count


def _collect_branch_citations(node: dict[str, Any]) -> list[str]:
    citations = normalize_citations(node.get("citations"))
    for child in node.get("children", []) or []:
        citations.extend(_collect_branch_citations(child))
    return citations


def serialize_mindmap(
    *,
    title: str,
    language: str,
    covered_until: str,
    instructions: str,
    mindmap: dict[str, Any] | None,
) -> tuple[str, int, list[str]]:
    if not mindmap:
        raise ValueError("mindmap is required for mindmap generation")

    root_topic = require_non_empty(str(mindmap.get("root_topic", "")), "mindmap.root_topic")
    branches = mindmap.get("branches", []) or []
    if not branches:
        raise ValueError("mindmap.branches must contain at least 1 branch")

    root = Element("mindmap", {
        "title": title,
        "language": language,
        "covered_until": covered_until,
    })
    if instructions:
        root.set("instructions", instructions)

    root_topic_el = SubElement(root, "root_topic")
    root_topic_el.text = root_topic

    root_citations = normalize_citations(mindmap.get("citations"))
    for citation in root_citations:
        citation_el = SubElement(root, "citation")
        citation_el.text = citation

    branch_count = 0
    all_citations = list(root_citations)
    for branch in branches:
        branch_count += _append_branch(root, branch)
        all_citations.extend(_collect_branch_citations(branch))

    return tostring(root, encoding="unicode"), branch_count, normalize_citations(all_citations)


def generate_mindmap(
    title: str,
    mindmap: dict[str, Any] | None = None,
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

    content, item_count, citations = serialize_mindmap(
        title=normalized_title,
        language=normalized_language,
        covered_until=normalized_scope,
        instructions=normalized_instructions,
        mindmap=mindmap,
    )

    return {
        "tool": "generate_mindmap",
        "material_type": "mindmap",
        "title": normalized_title,
        "language": normalized_language,
        "covered_until": normalized_scope,
        "content_format": "xml",
        "content": content,
        "item_count": item_count,
        "citations": citations,
        "status": "success",
    }
