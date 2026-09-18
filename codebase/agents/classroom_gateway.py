from __future__ import annotations

import asyncio
import json
import os
import uuid
from http import HTTPStatus
from typing import Any
from urllib.parse import urlparse

from websockets.asyncio.server import ServerConnection, serve
from websockets.datastructures import Headers
from websockets.exceptions import ConnectionClosed
from websockets.http11 import Request, Response

from classroom_runtime import create_live_classroom_session
from lesson_store import LessonStore


HOST = os.getenv("CLASSROOM_API_HOST", "0.0.0.0")
PORT = int(os.getenv("CLASSROOM_API_PORT", "8000"))


def _cors_headers(content_type: str, *, content_length: int, cache_control: str = "no-store") -> Headers:
    return Headers(
        {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET",
            "Cache-Control": cache_control,
            "Content-Length": str(content_length),
            "Content-Type": content_type,
        }
    )


def _json_response(status_code: int, payload: dict[str, Any]) -> Response:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    return Response(
        status_code,
        HTTPStatus(status_code).phrase,
        _cors_headers("application/json; charset=utf-8", content_length=len(body)),
        body,
    )


def _binary_response(status_code: int, body: bytes, *, content_type: str) -> Response:
    return Response(
        status_code,
        HTTPStatus(status_code).phrase,
        _cors_headers(content_type, content_length=len(body), cache_control="public, max-age=3600"),
        body,
    )


def _normalize_slide(value: Any) -> int:
    try:
        slide = int(value)
    except (TypeError, ValueError):
        return 1
    return max(1, slide)


def _normalize_auto_mode(value: Any) -> str:
    raw = str(value or "").strip()
    if raw in {"all", "teacher", "student", "generator"}:
        return raw
    return "all"


def _normalize_target(value: Any) -> str:
    raw = str(value or "").strip()
    if raw in {"all", "teacher", "student", "generator"}:
        return raw
    return "all"


def _split_path(raw_path: str) -> list[str]:
    path = urlparse(raw_path).path
    return [part for part in path.split("/") if part]


class ClassroomGateway:
    def __init__(self, store: LessonStore | None = None) -> None:
        self.store = store or LessonStore()

    def handle_http_request(self, request: Request) -> Response | None:
        path = urlparse(request.path).path
        if path == "/ws/classroom":
            return None

        try:
            if path == "/health":
                self.store.ensure_ready()
                return _json_response(
                    200,
                    {
                        "ok": True,
                        "service": "classroom-agents",
                    },
                )

            if path == "/api/artifacts":
                return _json_response(
                    200,
                    {
                        "artifacts": self.store.list_lessons(),
                    },
                )

            parts = _split_path(request.path)
            if len(parts) == 4 and parts[:2] == ["api", "artifacts"] and parts[3] == "conversations":
                return _json_response(
                    200,
                    {
                        "conversations": self.store.list_conversations(parts[2]),
                    },
                )

            if len(parts) == 3 and parts[:2] == ["api", "artifacts"]:
                return _json_response(200, self.store.get_lesson(parts[2]))

            if len(parts) == 4 and parts[:2] == ["api", "artifacts"] and parts[3] == "file":
                pdf = self.store.read_slide_pdf(parts[2])
                return _binary_response(200, pdf, content_type="application/pdf")

            return _json_response(404, {"message": "Endpoint not found."})
        except ValueError as exc:
            return _json_response(404, {"message": str(exc)})
        except FileNotFoundError as exc:
            return _json_response(404, {"message": str(exc)})
        except RuntimeError as exc:
            return _json_response(503, {"message": str(exc)})
        except Exception as exc:  # pragma: no cover - edge gateway safety
            return _json_response(500, {"message": str(exc)})

    async def process_request(self, connection: ServerConnection, request: Request) -> Response | None:
        return self.handle_http_request(request)

    async def handle_websocket(self, connection: ServerConnection) -> None:
        live_session = None
        try:
            while True:
                raw = await connection.recv()
                request_id = ""
                try:
                    payload = json.loads(raw)
                    if not isinstance(payload, dict):
                        raise ValueError("Payload must be a JSON object")

                    request_id = str(payload.get("request_id", "")).strip() or str(uuid.uuid4())
                    action = str(payload.get("action", "")).strip()

                    if action == "bootstrap":
                        artifact_id = str(payload.get("dayId") or payload.get("artifact_id") or "day1").strip() or "day1"
                        live_session = create_live_classroom_session(
                            artifact_id,
                            store=self.store,
                            current_slide=_normalize_slide(payload.get("currentSlide")),
                            provider_name=str(payload.get("provider", "")).strip() or None,
                            model=str(payload.get("model", "")).strip() or None,
                            source=str(payload.get("source", "")).strip() or "frontend_websocket",
                        )
                        snapshot = live_session.bootstrap(
                            current_slide=_normalize_slide(payload.get("currentSlide")),
                            auto_mode=_normalize_auto_mode(payload.get("autoMode")),
                        )
                    elif action == "sync_slide":
                        if live_session is None:
                            raise ValueError("Classroom session has not been bootstrapped.")
                        snapshot = live_session.sync_slide(
                            current_slide=_normalize_slide(payload.get("currentSlide")),
                            auto_mode=_normalize_auto_mode(payload.get("autoMode")),
                        )
                    elif action == "message":
                        if live_session is None:
                            raise ValueError("Classroom session has not been bootstrapped.")
                        text = str(payload.get("text", "")).strip()
                        if not text:
                            raise ValueError("text must not be empty")
                        snapshot = live_session.handle_message(
                            current_slide=_normalize_slide(payload.get("currentSlide")),
                            target=_normalize_target(payload.get("target")),
                            text=text,
                        )
                    else:
                        raise ValueError(f"Unsupported action: {action}")

                    await connection.send(
                        json.dumps(
                            {
                                "kind": "snapshot",
                                "request_id": request_id,
                                "snapshot": snapshot,
                            },
                            ensure_ascii=False,
                        )
                    )
                except Exception as exc:
                    await connection.send(
                        json.dumps(
                            {
                                "kind": "error",
                                "request_id": request_id or str(uuid.uuid4()),
                                "message": str(exc),
                            },
                            ensure_ascii=False,
                        )
                    )
        except ConnectionClosed:
            pass
        finally:
            if live_session is not None:
                live_session.close()


async def main() -> None:
    gateway = ClassroomGateway()
    async with serve(
        gateway.handle_websocket,
        host=HOST,
        port=PORT,
        process_request=gateway.process_request,
        max_size=2_000_000,
    ):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
