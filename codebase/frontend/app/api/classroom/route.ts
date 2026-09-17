import { NextResponse } from "next/server";
import {
  bootstrapClassroom,
  sendClassroomMessage,
  syncClassroomSlide,
} from "@/lib/classroom-server";
import type { AgentFilter, LectureDayId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClassroomRequestBody =
  | {
      action: "bootstrap";
      dayId?: LectureDayId;
      currentSlide?: number;
      autoMode?: AgentFilter;
    }
  | {
      action: "sync_slide";
      sessionId?: string;
      currentSlide?: number;
      autoMode?: AgentFilter;
    }
  | {
      action: "message";
      sessionId?: string;
      currentSlide?: number;
      target?: AgentFilter;
      text?: string;
    };

function normalizeAutoMode(value: AgentFilter | undefined): AgentFilter {
  if (value === "teacher" || value === "student" || value === "generator" || value === "all") {
    return value;
  }
  return "all";
}

function normalizeDayId(value: LectureDayId | undefined): LectureDayId {
  return value === "day2" ? "day2" : "day1";
}

function normalizeSlide(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalizeTarget(value: AgentFilter | undefined): AgentFilter {
  if (value === "teacher" || value === "student" || value === "generator" || value === "all") {
    return value;
  }
  return "all";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClassroomRequestBody;

    if (body.action === "bootstrap") {
      const snapshot = await bootstrapClassroom({
        dayId: normalizeDayId(body.dayId),
        currentSlide: normalizeSlide(body.currentSlide),
        autoMode: normalizeAutoMode(body.autoMode),
      });
      return NextResponse.json(snapshot);
    }

    if (body.action === "sync_slide") {
      if (!body.sessionId) {
        return NextResponse.json({ message: "Thiếu sessionId." }, { status: 400 });
      }
      const snapshot = await syncClassroomSlide({
        sessionId: body.sessionId,
        currentSlide: normalizeSlide(body.currentSlide),
        autoMode: normalizeAutoMode(body.autoMode),
      });
      return NextResponse.json(snapshot);
    }

    if (body.action === "message") {
      if (!body.sessionId) {
        return NextResponse.json({ message: "Thiếu sessionId." }, { status: 400 });
      }
      const text = body.text?.trim();
      if (!text) {
        return NextResponse.json({ message: "Tin nhắn không được để trống." }, { status: 400 });
      }
      const snapshot = await sendClassroomMessage({
        sessionId: body.sessionId,
        currentSlide: normalizeSlide(body.currentSlide),
        target: normalizeTarget(body.target),
        text,
      });
      return NextResponse.json(snapshot);
    }

    return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Classroom API failed",
      },
      { status: 500 },
    );
  }
}
