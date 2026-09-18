from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from classroom_cli import DEFAULT_INGEST_DIR, LectureDeck
from ingest.slides import ensure_slide_markdown


ROOT = Path(__file__).resolve().parent
DEFAULT_MONGO_URI = os.getenv("CLASSROOM_MONGODB_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017"
DEFAULT_DB_NAME = os.getenv("CLASSROOM_MONGODB_DB", "multi_agent_classroom")
CONVERSATION_SCOPES = {"shared", "private_ta", "private_student", "material"}


@dataclass(frozen=True)
class ArtifactSeed:
    artifact_id: str
    name: str
    file_name: str
    source_url: str


@dataclass(frozen=True)
class LessonBundle:
    artifact_id: str
    name: str
    source_url: str
    slide_path: Path
    markdown_path: Path
    markdown_content: str
    slide_count: int
    important_timestamp: list[dict[str, Any]]


LESSON_CATALOG: dict[str, ArtifactSeed] = {
    "day1": ArtifactSeed(
        artifact_id="day1",
        name="Day 1 — AI & LLM Foundation",
        file_name="d1-slide-hackathon.pdf",
        source_url="https://bleeper.s3.ap-southeast-2.amazonaws.com/d1-slide-hackathon.pdf",
    ),
    "day2": ArtifactSeed(
        artifact_id="day2",
        name="Day 2 — Xác định bài toán cho AI",
        file_name="d2-slide-hackathon.pdf",
        source_url="https://bleeper.s3.ap-southeast-2.amazonaws.com/d2-slide-hackathon.pdf",
    ),
}


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_artifact(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    return {key: value for key, value in doc.items() if key != "_id"}


def _topic_preview(text: str) -> str:
    cleaned = " ".join(text.strip().split())
    if not cleaned:
        return ""
    return cleaned if len(cleaned) <= 88 else f"{cleaned[:85]}..."


def _build_bundle(seed: ArtifactSeed) -> LessonBundle:
    slide_path = ROOT / "data" / "slides" / seed.file_name
    if not slide_path.exists():
        raise FileNotFoundError(f"Slide file not found: {slide_path}")

    markdown_path = ensure_slide_markdown(slide_path, Path(DEFAULT_INGEST_DIR))
    markdown_content = markdown_path.read_text(encoding="utf-8").strip()
    deck = LectureDeck.from_markdown(slide_path, markdown_path)
    important_timestamp = [
        {
            "marker": f"slide {slide.number}",
            "label": slide.title,
        }
        for slide in deck.slides
    ]

    return LessonBundle(
        artifact_id=seed.artifact_id,
        name=seed.name,
        source_url=seed.source_url,
        slide_path=slide_path,
        markdown_path=markdown_path,
        markdown_content=markdown_content,
        slide_count=deck.max_slide(),
        important_timestamp=important_timestamp,
    )


def _bundle_to_artifact_doc(bundle: LessonBundle) -> dict[str, Any]:
    return {
        "id": bundle.artifact_id,
        "name": bundle.name,
        "url": bundle.source_url,
        "metadata": {
            "artifact_type": "slide_deck",
            "source_file": bundle.slide_path.name,
            "markdown_file": bundle.markdown_path.name,
            "slide_count": bundle.slide_count,
            "transcripts": [
                {
                    "id": f"{bundle.artifact_id}-slides",
                    "title": f"{bundle.name} — Transcript từ slide",
                    "content": bundle.markdown_content,
                }
            ],
        },
    }


def _bundle_to_ingested_doc(bundle: LessonBundle) -> dict[str, Any]:
    return {
        "artifact_id": bundle.artifact_id,
        "content": bundle.markdown_content,
        "important_timestamp": bundle.important_timestamp,
    }


class LessonStore:
    def __init__(self, mongo_uri: str | None = None, db_name: str | None = None) -> None:
        self.mongo_uri = mongo_uri or DEFAULT_MONGO_URI
        self.db_name = db_name or DEFAULT_DB_NAME
        self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=3000)
        self.db = self.client[self.db_name]
        self.artifacts: Collection[dict[str, Any]] = self.db["artifacts"]
        self.ingested_artifacts: Collection[dict[str, Any]] = self.db["ingested_artifacts"]
        self.conversation_histories: Collection[dict[str, Any]] = self.db["conversation_histories"]
        self.generated_materials: Collection[dict[str, Any]] = self.db["generated_materials"]
        self._seeded = False

    def ensure_ready(self) -> None:
        try:
            self.client.admin.command("ping")
            self._ensure_indexes()
            self._ensure_seed_data()
        except PyMongoError as exc:
            raise RuntimeError(
                f"Không kết nối được MongoDB tại '{self.mongo_uri}'. Hãy khởi động Mongo trước khi dùng classroom backend."
            ) from exc

    def get_lesson_bundle(self, artifact_id: str) -> LessonBundle:
        seed = LESSON_CATALOG.get(artifact_id)
        if not seed:
            raise ValueError(f"Unknown artifact_id: {artifact_id}")
        return _build_bundle(seed)

    def list_lessons(self) -> list[dict[str, Any]]:
        self.ensure_ready()
        ingested_by_artifact = {
            doc["artifact_id"]: _normalize_artifact(doc)
            for doc in self.ingested_artifacts.find({}, {"_id": 0})
        }
        lessons: list[dict[str, Any]] = []
        for artifact in self.artifacts.find({}, {"_id": 0}).sort("id", ASCENDING):
            normalized = _normalize_artifact(artifact) or {}
            normalized["ingested_artifact"] = ingested_by_artifact.get(normalized.get("id", ""))
            normalized["file_path"] = f"/api/artifacts/{normalized.get('id', '')}/file"
            lessons.append(normalized)
        return lessons

    def get_lesson(self, artifact_id: str) -> dict[str, Any]:
        self.ensure_ready()
        artifact = _normalize_artifact(self.artifacts.find_one({"id": artifact_id}, {"_id": 0}))
        if not artifact:
            raise ValueError(f"Unknown artifact_id: {artifact_id}")
        artifact["ingested_artifact"] = _normalize_artifact(
            self.ingested_artifacts.find_one({"artifact_id": artifact_id}, {"_id": 0})
        )
        artifact["file_path"] = f"/api/artifacts/{artifact_id}/file"
        return artifact

    def read_slide_pdf(self, artifact_id: str) -> bytes:
        return self.get_lesson_bundle(artifact_id).slide_path.read_bytes()

    def append_conversation_turn(
        self,
        *,
        artifact_id: str,
        session_id: str,
        scope: str,
        actor: str,
        message: str,
        intent: str = "",
        citations: list[str] | None = None,
        slide_number: int | None = None,
        slide_title: str = "",
    ) -> None:
        self.ensure_ready()
        if scope not in CONVERSATION_SCOPES:
            raise ValueError(f"Unsupported conversation scope: {scope}")
        cleaned_message = message.strip()
        if not cleaned_message:
            return

        timestamp = _utc_now()
        conversation_id = f"{session_id}:{scope}"
        turn = {
            "timestamp": timestamp,
            "actor": actor.strip() or "unknown",
            "intent": intent.strip(),
            "message": cleaned_message,
            "citations": citations or [],
            "slide_number": slide_number,
            "slide_title": slide_title.strip(),
        }
        self.conversation_histories.update_one(
            {"id": conversation_id},
            {
                "$setOnInsert": {
                    "id": conversation_id,
                    "artifact_id": artifact_id,
                    "session_id": session_id,
                    "scope": scope,
                    "created_at": timestamp,
                    "message_count": 0,
                },
            },
            upsert=True,
        )
        self.conversation_histories.update_one(
            {"id": conversation_id},
            {
                "$set": {
                    "topic": _topic_preview(cleaned_message),
                    "updated_at": timestamp,
                },
                "$push": {"turns": turn},
                "$inc": {"message_count": 1},
            },
        )

    def list_conversations(self, artifact_id: str, *, limit: int = 50) -> list[dict[str, Any]]:
        self.ensure_ready()
        cursor = self.conversation_histories.find(
            {"artifact_id": artifact_id},
            {
                "_id": 0,
                "id": 1,
                "artifact_id": 1,
                "scope": 1,
                "topic": 1,
                "created_at": 1,
                "updated_at": 1,
                "message_count": 1,
            },
        ).sort("updated_at", DESCENDING).limit(max(1, limit))
        return [_normalize_artifact(doc) or {} for doc in cursor]

    def list_recent_topics(self, artifact_id: str, *, limit: int = 8) -> list[str]:
        topics: list[str] = []
        for item in self.list_conversations(artifact_id, limit=limit):
            topic = str(item.get("topic", "")).strip()
            if topic:
                topics.append(topic)
        return topics

    def save_generated_material(
        self,
        *,
        artifact_id: str,
        material_type: str,
        title: str,
        content: Any,
        content_format: str,
        item_count: int = 0,
        citations: list[str] | None = None,
        covered_until: str = "",
        slide_number: int | None = None,
        slide_title: str = "",
        session_id: str = "",
    ) -> dict[str, Any]:
        self.ensure_ready()
        timestamp = _utc_now()
        material_id = f"mat-{uuid.uuid4()}"
        doc: dict[str, Any] = {
            "id": material_id,
            "artifact_id": artifact_id,
            "session_id": session_id,
            "material_type": material_type,
            "title": title.strip() or f"Học liệu {material_type}",
            "content_format": content_format,
            "content": content,
            "item_count": max(0, int(item_count)),
            "citations": citations or [],
            "covered_until": covered_until,
            "slide_number": slide_number,
            "slide_title": slide_title,
            "created_at": timestamp,
            "updated_at": timestamp,
        }
        self.generated_materials.insert_one(doc)
        return _normalize_artifact(doc) or doc

    def list_generated_materials(
        self,
        artifact_id: str,
        *,
        material_type: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        self.ensure_ready()
        query: dict[str, Any] = {"artifact_id": artifact_id}
        if material_type and material_type != "all":
            query["material_type"] = material_type
        cursor = (
            self.generated_materials.find(query, {"_id": 0})
            .sort("created_at", DESCENDING)
            .limit(max(1, limit))
        )
        return [_normalize_artifact(doc) or {} for doc in cursor]

    def get_generated_material(self, material_id: str) -> dict[str, Any] | None:
        self.ensure_ready()
        doc = self.generated_materials.find_one({"id": material_id}, {"_id": 0})
        return _normalize_artifact(doc)

    def _ensure_indexes(self) -> None:
        self.artifacts.create_index([("id", ASCENDING)], unique=True, name="artifact_id_unique")
        self.ingested_artifacts.create_index(
            [("artifact_id", ASCENDING)],
            unique=True,
            name="ingested_artifact_id_unique",
        )
        self.conversation_histories.create_index([("id", ASCENDING)], unique=True, name="conversation_id_unique")
        self.conversation_histories.create_index(
            [("artifact_id", ASCENDING), ("updated_at", DESCENDING)],
            name="conversation_artifact_updated_at_idx",
        )
        self.generated_materials.create_index([("id", ASCENDING)], unique=True, name="generated_material_id_unique")
        self.generated_materials.create_index(
            [("artifact_id", ASCENDING), ("created_at", DESCENDING)],
            name="material_artifact_created_at_idx",
        )
        self.generated_materials.create_index(
            [("artifact_id", ASCENDING), ("material_type", ASCENDING)],
            name="material_artifact_type_idx",
        )

    def _ensure_seed_data(self) -> None:
        if self._seeded:
            return
        for seed in LESSON_CATALOG.values():
            bundle = _build_bundle(seed)
            self.artifacts.update_one(
                {"id": bundle.artifact_id},
                {"$set": _bundle_to_artifact_doc(bundle)},
                upsert=True,
            )
            self.ingested_artifacts.update_one(
                {"artifact_id": bundle.artifact_id},
                {"$set": _bundle_to_ingested_doc(bundle)},
                upsert=True,
            )
        self._seeded = True
