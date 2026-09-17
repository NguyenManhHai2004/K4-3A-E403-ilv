from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any


ROOT = Path(__file__).resolve().parent
DEFAULT_LOG_PATH = ROOT / "data" / "logs" / "classroom_events.jsonl"
_WRITE_LOCK = Lock()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, dict):
        return {str(key): _normalize_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_normalize_value(item) for item in value]
    return str(value)


class ClassroomLogger:
    def __init__(self, *, session_id: str, source: str, log_path: Path | None = None) -> None:
        self.session_id = session_id.strip() or "unknown-session"
        self.source = source.strip() or "unknown-source"
        self.log_path = log_path or Path(os.getenv("CLASSROOM_LOG_PATH", DEFAULT_LOG_PATH))

    def log_event(self, event_type: str, **fields: Any) -> None:
        record = {
            "timestamp": _utc_now(),
            "session_id": self.session_id,
            "source": self.source,
            "event_type": event_type.strip() or "unknown_event",
            **{key: _normalize_value(value) for key, value in fields.items()},
        }
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        with _WRITE_LOCK:
            with self.log_path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(record, ensure_ascii=False) + "\n")
