from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, TypeVar
from xml.etree import ElementTree

from classroom_cli import ClassroomSession, LectureDeck, _validate_live_provider
from classroom_logging import ClassroomLogger
from env_loader import load_lab_env
from lesson_store import LessonStore
from providers import make_provider


ROOT = Path(__file__).resolve().parent
MATERIAL_KEYWORDS = {
    "flashcard": ("flashcard", "flash card", "thẻ", "the", "card"),
    "mindmap": ("mindmap", "mind map", "sơ đồ", "so do"),
    "quiz": ("quiz", "trắc nghiệm", "trac nghiem", "câu hỏi", "cau hoi"),
}
CONVERSATION_SCOPES = ("shared", "private_ta", "private_student", "material")
HistoryCallable = TypeVar("HistoryCallable")


def empty_artifact_store() -> dict[str, Any]:
    return {
        "quiz": None,
        "flashcard": None,
        "mindmap": None,
    }


def empty_channel_histories() -> dict[str, list[str]]:
    return {scope: [] for scope in CONVERSATION_SCOPES}


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


@dataclass
class LiveClassroomSession:
    session_id: str
    artifact_id: str
    lesson_name: str
    session: ClassroomSession
    store: LessonStore
    pending_prompt: dict[str, str] | None = None
    artifacts: dict[str, Any] = field(default_factory=empty_artifact_store)
    channel_histories: dict[str, list[str]] = field(default_factory=empty_channel_histories)

    def bootstrap(self, *, current_slide: int, auto_mode: str) -> dict[str, Any]:
        self.session.set_current_slide(current_slide, reason="bootstrap", emit_log=False)
        events = self._run_auto_turn(auto_mode)
        self._persist_agent_events(events)
        return self._snapshot(events)

    def sync_slide(self, *, current_slide: int, auto_mode: str) -> dict[str, Any]:
        previous_slide = self.session.current_slide
        self.session.set_current_slide(current_slide, reason="state_restore", emit_log=False)
        if previous_slide != current_slide:
            self.session.logger.log_event(
                "slide_changed",
                actor="learner",
                reason="frontend_navigation",
                previous_slide=previous_slide,
                current_slide=current_slide,
                current_slide_title=self.session.get_current_slide().title,
                source_file=self.session.deck.source_path.name,
                markdown_file=self.session.deck.markdown_path.name,
                slide_number=self.session.current_slide,
                slide_title=self.session.get_current_slide().title,
            )
        events = self._run_auto_turn(auto_mode)
        self._persist_agent_events(events)
        return self._snapshot(events)

    def handle_message(self, *, current_slide: int, target: str, text: str) -> dict[str, Any]:
        self.session.set_current_slide(current_slide, reason="state_restore", emit_log=False)
        events: list[dict[str, Any]] = []
        new_artifacts: list[dict[str, Any]] = []
        trimmed = text.strip()

        if target == "teacher":
            self._persist_user_turn("private_ta", trimmed, intent="question")
            ta_turn = self._run_in_scope("private_ta", lambda: self.session.ask_ta(trimmed, channel="private_ta"))
            events.append(_message_event("teacher", ta_turn, channel="private_ta"))
        elif target == "generator":
            self._persist_user_turn("material", trimmed, intent="generate_material")
            result = self._run_in_scope("material", lambda: self.session.generate_material(_infer_material_type(trimmed), trimmed))
            payload = result.get("agent_response") or {}
            if payload.get("reply"):
                events.append(_message_event("generator", payload, channel="material"))
            artifact = _material_artifact(result)
            if artifact:
                new_artifacts.append(artifact)
        elif target == "student":
            if self.pending_prompt and self.pending_prompt.get("mode") == "student":
                self._persist_user_turn("private_student", trimmed, intent="answer")
                student_feedback = self._run_in_scope(
                    "private_student",
                    lambda: self.session.finish_private_student_round(self.pending_prompt["question"], trimmed),
                )
                self.pending_prompt = None
                events.append(_message_event("student", student_feedback, channel="private_student"))
            else:
                student_turn = self._run_in_scope("private_student", self.session.start_private_student_round)
                event = _message_event("student", student_turn, channel="private_student")
                if event["reply"]:
                    self.pending_prompt = {"mode": "student", "question": event["reply"]}
                    events.append(event)
        elif self.pending_prompt and self.pending_prompt.get("mode") == "shared":
            self._persist_user_turn("shared", trimmed, intent="answer")
            ta_turn = self._run_in_scope(
                "shared",
                lambda: self.session.finish_shared_round(self.pending_prompt["question"], trimmed),
            )
            self.pending_prompt = None
            events.append(_message_event("teacher", ta_turn, channel="shared"))
        elif any(keyword in trimmed.lower() for keyword in ("quiz", "flashcard", "flash card", "mindmap", "mind map")):
            self._persist_user_turn("material", trimmed, intent="generate_material")
            result = self._run_in_scope("material", lambda: self.session.generate_material(_infer_material_type(trimmed), trimmed))
            payload = result.get("agent_response") or {}
            if payload.get("reply"):
                events.append(_message_event("generator", payload, channel="material"))
            artifact = _material_artifact(result)
            if artifact:
                new_artifacts.append(artifact)
        else:
            self._persist_user_turn("shared", trimmed, intent="question")
            ta_turn = self._run_in_scope("shared", lambda: self.session.ask_ta(trimmed, channel="shared"))
            events.append(_message_event("teacher", ta_turn, channel="shared"))

        self._merge_artifacts(new_artifacts)
        self._persist_agent_events(events)
        return self._snapshot(events)

    def close(self) -> None:
        logger = self.session.logger
        if logger:
            logger.log_event(
                "session_closed",
                actor="system",
                day_id=self.artifact_id,
                slide_number=self.session.current_slide,
                slide_title=self.session.get_current_slide().title,
            )

    def _run_auto_turn(self, auto_mode: str) -> list[dict[str, Any]]:
        if auto_mode == "all":
            student_turn = self._run_in_scope("shared", self.session.start_shared_round)
            event = _message_event("student", student_turn, channel="shared")
            if event["reply"]:
                self.pending_prompt = {"mode": "shared", "question": event["reply"]}
                return [event]
            self.pending_prompt = None
            return []
        if auto_mode == "teacher":
            ta_turn = self._run_in_scope(
                "private_ta",
                lambda: self.session.ask_ta(
                    "Em vừa chuyển sang slide này. Thầy hãy tóm tắt ngắn ý chính và nhắc em 1 điểm quan trọng cần chú ý.",
                    channel="private_ta",
                ),
            )
            self.pending_prompt = None
            event = _message_event("teacher", ta_turn, channel="private_ta")
            return [event] if event["reply"] else []
        if auto_mode == "student":
            student_turn = self._run_in_scope("private_student", self.session.start_private_student_round)
            event = _message_event("student", student_turn, channel="private_student")
            if event["reply"]:
                self.pending_prompt = {"mode": "student", "question": event["reply"]}
                return [event]
            self.pending_prompt = None
            return []
        self.pending_prompt = None
        return []

    def _run_in_scope(self, scope: str, fn: Callable[[], HistoryCallable]) -> HistoryCallable:
        scoped_history = list(self.channel_histories.get(scope, []))
        self.session.chat_history = scoped_history
        result = fn()
        self.channel_histories[scope] = list(self.session.chat_history[-10:])
        return result

    def _persist_user_turn(self, scope: str, message: str, *, intent: str) -> None:
        self.store.append_conversation_turn(
            artifact_id=self.artifact_id,
            session_id=self.session_id,
            scope=scope,
            actor="learner",
            message=message,
            intent=intent,
            slide_number=self.session.current_slide,
            slide_title=self.session.get_current_slide().title,
        )

    def _persist_agent_events(self, events: list[dict[str, Any]]) -> None:
        for event in events:
            reply = str(event.get("reply", "")).strip()
            if not reply:
                continue
            self.store.append_conversation_turn(
                artifact_id=self.artifact_id,
                session_id=self.session_id,
                scope=str(event.get("channel", "shared")).strip() or "shared",
                actor=str(event.get("agent", "unknown")).strip() or "unknown",
                message=reply,
                intent=str(event.get("intent", "")).strip(),
                citations=_normalize_refs(event.get("citations")),
                slide_number=self.session.current_slide,
                slide_title=self.session.get_current_slide().title,
            )

    def _merge_artifacts(self, artifacts: list[dict[str, Any]]) -> None:
        for artifact in artifacts:
            material_type = str(artifact.get("material_type", "")).strip()
            if material_type in self.artifacts:
                self.artifacts[material_type] = artifact

    def _snapshot(self, events: list[dict[str, Any]]) -> dict[str, Any]:
        current = self.session.get_current_slide()
        return {
            "sessionId": self.session_id,
            "dayId": self.artifact_id,
            "currentSlide": current.number,
            "currentSlideTitle": current.title,
            "maxSlide": self.session.deck.max_slide(),
            "pendingPrompt": _normalize_pending(self.pending_prompt),
            "artifacts": self.artifacts,
            "historyTopics": self.store.list_recent_topics(self.artifact_id, limit=8),
            "events": events,
        }


def create_live_classroom_session(
    artifact_id: str,
    *,
    store: LessonStore,
    current_slide: int,
    provider_name: str | None = None,
    model: str | None = None,
    source: str = "frontend_websocket",
    session_id: str | None = None,
) -> LiveClassroomSession:
    load_lab_env(ROOT)
    lesson = store.get_lesson_bundle(artifact_id)
    resolved_provider = (provider_name or os.getenv("CLASSROOM_PROVIDER") or "openai").strip()
    _validate_live_provider(resolved_provider)
    deck = LectureDeck.from_markdown(lesson.slide_path, lesson.markdown_path)
    session_uuid = session_id or f"ws-{uuid.uuid4()}"
    logger = ClassroomLogger(session_id=session_uuid, source=source)
    provider = make_provider(resolved_provider)
    session = ClassroomSession(deck=deck, provider=provider, model=model, logger=logger)
    session.set_current_slide(current_slide, reason="state_restore", emit_log=False)
    logger.log_event(
        "session_started",
        actor="system",
        day_id=artifact_id,
        provider=resolved_provider,
        model=model,
        source_file=session.deck.source_path.name,
        markdown_file=session.deck.markdown_path.name,
        slide_number=session.current_slide,
        slide_title=session.get_current_slide().title,
    )
    return LiveClassroomSession(
        session_id=session_uuid,
        artifact_id=artifact_id,
        lesson_name=lesson.name,
        session=session,
        store=store,
    )
