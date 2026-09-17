from __future__ import annotations

import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any
from xml.etree import ElementTree

from classroom_logging import ClassroomLogger
from classroom_cli import (
    DEFAULT_INGEST_DIR,
    ClassroomSession,
    LectureDeck,
    _validate_live_provider,
)
from env_loader import load_lab_env
from ingest.slides import ensure_slide_markdown
from providers import make_provider


ROOT = Path(__file__).resolve().parent
DECKS = {
    "day1": {
        "file_name": "d1-slide-hackathon.pdf",
        "source_url": "https://bleeper.s3.ap-southeast-2.amazonaws.com/d1-slide-hackathon.pdf",
    },
    "day2": {
        "file_name": "d2-slide-hackathon.pdf",
        "source_url": "https://bleeper.s3.ap-southeast-2.amazonaws.com/d2-slide-hackathon.pdf",
    },
}
MATERIAL_KEYWORDS = {
    "flashcard": ("flashcard", "flash card", "thẻ", "the", "card"),
    "mindmap": ("mindmap", "mind map", "sơ đồ", "so do"),
    "quiz": ("quiz", "trắc nghiệm", "trac nghiem", "câu hỏi", "cau hoi"),
}


def _normalize_refs(raw: Any) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, (str, int, float)):
        text = str(raw).strip()
        return [text] if text else []
    if isinstance(raw, list):
        result: list[str] = []
        for item in raw:
            result.extend(_normalize_refs(item))
        return list(dict.fromkeys(result))
    text = str(raw).strip()
    return [text] if text else []


def _normalize_pending(raw: Any) -> dict[str, str] | None:
    if not isinstance(raw, dict):
        return None
    mode = str(raw.get("mode", "")).strip()
    question = str(raw.get("question", "")).strip()
    if mode not in {"shared", "student"} or not question:
        return None
    return {"mode": mode, "question": question}


def _resolve_slide_path(day_id: str) -> Path:
    deck = DECKS.get(day_id)
    if not deck:
        raise ValueError(f"Unknown day_id: {day_id}")
    slide_path = ROOT / "data" / "slides" / deck["file_name"]
    if not slide_path.exists():
        raise FileNotFoundError(f"Slide file not found: {slide_path}")
    return slide_path


def _infer_material_type(text: str) -> str:
    lowered = text.lower()
    for material_type, keywords in MATERIAL_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return material_type
    return "quiz"


def _message_event(agent: str, payload: dict[str, Any], *, channel: str) -> dict[str, Any]:
    return {
        "kind": "message",
        "agent": agent,
        "channel": channel,
        "intent": str(payload.get("intent", "")).strip(),
        "reply": str(payload.get("reply", "")).strip(),
        "citations": _normalize_refs(payload.get("citations") or payload.get("evidence_ids")),
        "active_recall": agent == "student" and str(payload.get("intent")) == "ask_question",
    }


def _parse_material_content(content_format: str, content: str) -> dict[str, Any]:
    if content_format == "json":
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else {}

    root = ElementTree.fromstring(content)

    def parse_branch(node: ElementTree.Element) -> dict[str, Any]:
        return {
            "label": node.attrib.get("label", "").strip(),
            "citations": [child.text.strip() for child in node.findall("citation") if child.text and child.text.strip()],
            "children": [parse_branch(child) for child in node.findall("branch")],
        }

    return {
        "type": "mindmap",
        "title": root.attrib.get("title", "").strip(),
        "language": root.attrib.get("language", "").strip(),
        "covered_until": root.attrib.get("covered_until", "").strip(),
        "instructions": root.attrib.get("instructions", "").strip(),
        "root_topic": (root.findtext("root_topic") or "").strip(),
        "citations": [child.text.strip() for child in root.findall("citation") if child.text and child.text.strip()],
        "branches": [parse_branch(child) for child in root.findall("branch")],
    }


def _material_artifact(result: dict[str, Any]) -> dict[str, Any] | None:
    tool_results = result.get("tool_results") or []
    if not tool_results:
        return None
    final_result = tool_results[0].get("result") or {}
    content_format = str(final_result.get("content_format", "")).strip()
    content = str(final_result.get("content", "")).strip()
    if not content_format or not content:
        return None
    return {
        "material_type": str(final_result.get("material_type", "")).strip(),
        "title": str(final_result.get("title", "")).strip(),
        "covered_until": str(final_result.get("covered_until", "")).strip(),
        "content_format": content_format,
        "item_count": int(final_result.get("item_count", 0) or 0),
        "citations": _normalize_refs(final_result.get("citations")),
        "content": _parse_material_content(content_format, content),
    }


def _new_session(
    day_id: str,
    *,
    provider_name: str,
    model: str | None,
    logger: ClassroomLogger,
) -> ClassroomSession:
    load_lab_env(ROOT)
    _validate_live_provider(provider_name)
    slide_path = _resolve_slide_path(day_id)
    markdown_path = ensure_slide_markdown(slide_path, Path(DEFAULT_INGEST_DIR))
    deck = LectureDeck.from_markdown(slide_path, markdown_path)
    provider = make_provider(provider_name)
    return ClassroomSession(deck=deck, provider=provider, model=model, logger=logger)


def _run_auto_turn(session: ClassroomSession, auto_mode: str) -> tuple[list[dict[str, Any]], dict[str, str] | None]:
    if auto_mode == "all":
        student_turn = session.start_shared_round()
        event = _message_event("student", student_turn, channel="shared")
        if event["reply"]:
            return [event], {"mode": "shared", "question": event["reply"]}
        return [], None
    if auto_mode == "teacher":
        ta_turn = session.ask_ta(
            "Em vừa chuyển sang slide này. Thầy hãy tóm tắt ngắn ý chính và nhắc em 1 điểm quan trọng cần chú ý.",
            channel="private_ta",
        )
        event = _message_event("teacher", ta_turn, channel="private_ta")
        return ([event] if event["reply"] else []), None
    if auto_mode == "student":
        student_turn = session.start_private_student_round()
        event = _message_event("student", student_turn, channel="private_student")
        if event["reply"]:
            return [event], {"mode": "student", "question": event["reply"]}
        return [], None
    return [], None


def _handle_message(
    session: ClassroomSession,
    *,
    target: str,
    text: str,
    pending_prompt: dict[str, str] | None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, str] | None]:
    events: list[dict[str, Any]] = []
    artifacts: list[dict[str, Any]] = []

    if target == "teacher":
        ta_turn = session.ask_ta(text, channel="private_ta")
        events.append(_message_event("teacher", ta_turn, channel="private_ta"))
        return events, artifacts, pending_prompt

    if target == "generator":
        material_type = _infer_material_type(text)
        result = session.generate_material(material_type, text)
        payload = result.get("agent_response") or {}
        if payload.get("reply"):
            events.append(_message_event("generator", payload, channel="material"))
        artifact = _material_artifact(result)
        if artifact:
            artifacts.append(artifact)
        return events, artifacts, pending_prompt

    if target == "student":
        if pending_prompt and pending_prompt.get("mode") == "student":
            student_feedback = session.finish_private_student_round(pending_prompt["question"], text)
            events.append(_message_event("student", student_feedback, channel="private_student"))
            return events, artifacts, None

        student_turn = session.start_private_student_round()
        event = _message_event("student", student_turn, channel="private_student")
        if event["reply"]:
            events.append(event)
            return events, artifacts, {"mode": "student", "question": event["reply"]}
        return events, artifacts, None

    if pending_prompt and pending_prompt.get("mode") == "shared":
        ta_turn = session.finish_shared_round(pending_prompt["question"], text)
        events.append(_message_event("teacher", ta_turn, channel="shared"))
        return events, artifacts, None

    if any(keyword in text.lower() for keyword in ("quiz", "flashcard", "flash card", "mindmap", "mind map")):
        material_type = _infer_material_type(text)
        result = session.generate_material(material_type, text)
        payload = result.get("agent_response") or {}
        if payload.get("reply"):
            events.append(_message_event("generator", payload, channel="material"))
        artifact = _material_artifact(result)
        if artifact:
            artifacts.append(artifact)
        return events, artifacts, pending_prompt

    ta_turn = session.ask_ta(text, channel="shared")
    events.append(_message_event("teacher", ta_turn, channel="shared"))
    return events, artifacts, pending_prompt


def handle_request(payload: dict[str, Any]) -> dict[str, Any]:
    action = str(payload.get("action", "")).strip()
    day_id = str(payload.get("day_id", "")).strip() or "day1"
    current_slide = int(payload.get("current_slide", 1) or 1)
    previous_slide = int(payload.get("previous_slide", current_slide) or current_slide)
    provider_name = str(payload.get("provider") or os.getenv("CLASSROOM_PROVIDER") or "openai").strip()
    model = str(payload.get("model", "")).strip() or None
    session_id = str(payload.get("session_id", "")).strip() or f"web-{uuid.uuid4()}"
    source = str(payload.get("source", "")).strip() or "frontend"
    logger = ClassroomLogger(session_id=session_id, source=source)
    pending_prompt = _normalize_pending(payload.get("pending_prompt"))
    logger.log_event(
        "request_received",
        actor="system",
        action=action,
        day_id=day_id,
        current_slide=current_slide,
        target=str(payload.get("target", "")).strip(),
        auto_mode=str(payload.get("auto_mode", "")).strip(),
        has_pending_prompt=bool(pending_prompt),
    )

    session = _new_session(day_id, provider_name=provider_name, model=model, logger=logger)
    session.chat_history = [str(entry).strip() for entry in payload.get("chat_history", []) if str(entry).strip()][-10:]
    session.set_current_slide(current_slide, reason="state_restore", emit_log=False)
    events: list[dict[str, Any]] = []
    artifacts: list[dict[str, Any]] = []

    if action == "bootstrap":
        logger.log_event(
            "session_started",
            actor="system",
            day_id=day_id,
            provider=provider_name,
            model=model,
            source_file=session.deck.source_path.name,
            markdown_file=session.deck.markdown_path.name,
            slide_number=session.current_slide,
            slide_title=session.get_current_slide().title,
        )
        events, pending_prompt = _run_auto_turn(session, str(payload.get("auto_mode", "all")).strip())
    elif action == "sync_slide":
        if previous_slide != current_slide:
            logger.log_event(
                "slide_changed",
                actor="learner",
                reason="frontend_navigation",
                previous_slide=previous_slide,
                current_slide=current_slide,
                current_slide_title=session.get_current_slide().title,
                source_file=session.deck.source_path.name,
                markdown_file=session.deck.markdown_path.name,
                slide_number=session.current_slide,
                slide_title=session.get_current_slide().title,
            )
        events, pending_prompt = _run_auto_turn(session, str(payload.get("auto_mode", "all")).strip())
    elif action == "message":
        text = str(payload.get("text", "")).strip()
        if not text:
            raise ValueError("text must not be empty")
        target = str(payload.get("target", "all")).strip()
        events, artifacts, pending_prompt = _handle_message(
            session,
            target=target,
            text=text,
            pending_prompt=pending_prompt,
        )
    else:
        raise ValueError(f"Unsupported action: {action}")

    current = session.get_current_slide()
    deck_meta = DECKS[day_id]
    return {
        "ok": True,
        "state": {
            "day_id": day_id,
            "current_slide": current.number,
            "current_slide_title": current.title,
            "max_slide": session.deck.max_slide(),
            "chat_history": session.chat_history,
            "pending_prompt": pending_prompt,
            "source_url": deck_meta["source_url"],
            "source_file": session.deck.source_path.name,
            "markdown_file": session.deck.markdown_path.name,
        },
        "events": events,
        "artifacts": artifacts,
    }


def main() -> None:
    raw = sys.stdin.read().strip()
    if not raw:
        raise ValueError("Expected JSON payload on stdin")
    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a JSON object")
    response = handle_request(payload)
    sys.stdout.write(json.dumps(response, ensure_ascii=False))


if __name__ == "__main__":
    raw_payload = ""
    try:
        raw_payload = sys.stdin.read().strip()
        if not raw_payload:
            raise ValueError("Expected JSON payload on stdin")
        payload = json.loads(raw_payload)
        if not isinstance(payload, dict):
            raise ValueError("Payload must be a JSON object")
        response = handle_request(payload)
        sys.stdout.write(json.dumps(response, ensure_ascii=False))
    except Exception as exc:  # pragma: no cover - CLI bridge safety
        try:
            payload = json.loads(raw_payload) if raw_payload else {}
        except Exception:
            payload = {}
        logger = ClassroomLogger(
            session_id=str(payload.get("session_id", "")).strip() or f"web-{uuid.uuid4()}",
            source=str(payload.get("source", "")).strip() or "frontend",
        )
        logger.log_event(
            "request_failed",
            actor="system",
            action=str(payload.get("action", "")).strip(),
            error_type=type(exc).__name__,
            error_message=str(exc),
        )
        sys.stdout.write(json.dumps({
            "ok": False,
            "error": type(exc).__name__,
            "message": str(exc),
        }, ensure_ascii=False))
        sys.exit(1)
