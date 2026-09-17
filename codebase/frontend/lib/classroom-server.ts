import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type {
  AgentFilter,
  ArtifactStore,
  ClassroomAgentEvent,
  ClassroomSessionSnapshot,
  GeneratedArtifact,
  LectureDayId,
  PendingPrompt,
} from "./types";

interface BridgeState {
  day_id: LectureDayId;
  current_slide: number;
  current_slide_title: string;
  max_slide: number;
  chat_history: string[];
  pending_prompt: PendingPrompt | null;
}

interface BridgeResponse {
  ok: boolean;
  state?: BridgeState;
  events?: ClassroomAgentEvent[];
  artifacts?: GeneratedArtifact[];
  error?: string;
  message?: string;
}

interface ClassroomServerSession {
  id: string;
  dayId: LectureDayId;
  currentSlide: number;
  currentSlideTitle: string;
  maxSlide: number;
  chatHistory: string[];
  pendingPrompt: PendingPrompt | null;
  artifacts: ArtifactStore;
  historyTopics: string[];
}

type BootstrapInput = {
  dayId: LectureDayId;
  currentSlide: number;
  autoMode: AgentFilter;
};

type SessionActionInput = {
  sessionId: string;
  currentSlide: number;
  autoMode: AgentFilter;
};

type MessageInput = {
  sessionId: string;
  currentSlide: number;
  target: AgentFilter;
  text: string;
};

const PYTHON_BRIDGE_PATH = path.join(process.cwd(), "..", "agents", "classroom_api.py");
const PYTHON_VENV_PATH = path.join(process.cwd(), "..", "agents", ".venv", "bin", "python");

function emptyArtifacts(): ArtifactStore {
  return {
    quiz: null,
    flashcard: null,
    mindmap: null,
  };
}

function topicFromEvent(event: ClassroomAgentEvent): string | null {
  const reply = event.reply.trim();
  if (!reply) return null;
  return reply.length > 88 ? `${reply.slice(0, 85)}...` : reply;
}

function mergeArtifacts(current: ArtifactStore, incoming: GeneratedArtifact[]): ArtifactStore {
  const next: ArtifactStore = { ...current };
  for (const artifact of incoming) {
    if (artifact.material_type === "quiz") next.quiz = artifact;
    if (artifact.material_type === "flashcard") next.flashcard = artifact;
    if (artifact.material_type === "mindmap") next.mindmap = artifact;
  }
  return next;
}

function toSnapshot(session: ClassroomServerSession, events: ClassroomAgentEvent[]): ClassroomSessionSnapshot {
  return {
    sessionId: session.id,
    dayId: session.dayId,
    currentSlide: session.currentSlide,
    currentSlideTitle: session.currentSlideTitle,
    maxSlide: session.maxSlide,
    pendingPrompt: session.pendingPrompt,
    artifacts: session.artifacts,
    historyTopics: session.historyTopics,
    events,
  };
}

function normalizeSlide(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function getSessionStore(): Map<string, ClassroomServerSession> {
  const globalStore = globalThis as typeof globalThis & {
    __classroomSessions?: Map<string, ClassroomServerSession>;
  };
  if (!globalStore.__classroomSessions) {
    globalStore.__classroomSessions = new Map<string, ClassroomServerSession>();
  }
  return globalStore.__classroomSessions;
}

function getPythonCommand(): string {
  return fs.existsSync(PYTHON_VENV_PATH) ? PYTHON_VENV_PATH : "python3";
}

async function runBridge(payload: Record<string, unknown>): Promise<BridgeResponse> {
  const python = getPythonCommand();
  return new Promise<BridgeResponse>((resolve, reject) => {
    const child = spawn(python, [PYTHON_BRIDGE_PATH], {
      cwd: path.join(process.cwd(), "..", "agents"),
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (!stdout.trim()) {
        reject(new Error(stderr.trim() || `Python bridge exited with code ${code ?? "unknown"}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as BridgeResponse);
      } catch (error) {
        reject(new Error(`Unable to parse Python bridge response: ${String(error)}\n${stdout}\n${stderr}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

function assertBridgeOk(response: BridgeResponse): asserts response is BridgeResponse & {
  ok: true;
  state: BridgeState;
  events: ClassroomAgentEvent[];
  artifacts: GeneratedArtifact[];
} {
  if (!response.ok || !response.state || !response.events || !response.artifacts) {
    const detail = response.message || response.error || "Unknown classroom bridge error";
    throw new Error(detail);
  }
}

function ensureSession(sessionId: string): ClassroomServerSession {
  const session = getSessionStore().get(sessionId);
  if (!session) {
    throw new Error("Session classroom không còn tồn tại. Hãy tải lại trang để khởi tạo phiên mới.");
  }
  return session;
}

function applyBridgeResult(
  existing: ClassroomServerSession,
  response: BridgeResponse & {
    ok: true;
    state: BridgeState;
    events: ClassroomAgentEvent[];
    artifacts: GeneratedArtifact[];
  },
): ClassroomServerSession {
  const topics = response.events
    .map(topicFromEvent)
    .filter((value): value is string => Boolean(value));

  return {
    ...existing,
    dayId: response.state.day_id,
    currentSlide: response.state.current_slide,
    currentSlideTitle: response.state.current_slide_title,
    maxSlide: response.state.max_slide,
    chatHistory: response.state.chat_history,
    pendingPrompt: response.state.pending_prompt,
    artifacts: mergeArtifacts(existing.artifacts, response.artifacts),
    historyTopics: [...topics.reverse(), ...existing.historyTopics].slice(0, 8),
  };
}

export async function bootstrapClassroom(input: BootstrapInput): Promise<ClassroomSessionSnapshot> {
  const sessionId = randomUUID();
  const seed: ClassroomServerSession = {
    id: sessionId,
    dayId: input.dayId,
    currentSlide: normalizeSlide(input.currentSlide),
    currentSlideTitle: "",
    maxSlide: 1,
    chatHistory: [],
    pendingPrompt: null,
    artifacts: emptyArtifacts(),
    historyTopics: [],
  };

  const response = await runBridge({
    action: "bootstrap",
    session_id: sessionId,
    source: "frontend",
    day_id: seed.dayId,
    current_slide: seed.currentSlide,
    auto_mode: input.autoMode,
    chat_history: seed.chatHistory,
    pending_prompt: seed.pendingPrompt,
  });
  assertBridgeOk(response);

  const next = applyBridgeResult(seed, response);
  getSessionStore().set(sessionId, next);
  return toSnapshot(next, response.events);
}

export async function syncClassroomSlide(input: SessionActionInput): Promise<ClassroomSessionSnapshot> {
  const current = ensureSession(input.sessionId);
  const response = await runBridge({
    action: "sync_slide",
    session_id: current.id,
    source: "frontend",
    day_id: current.dayId,
    previous_slide: current.currentSlide,
    current_slide: normalizeSlide(input.currentSlide),
    auto_mode: input.autoMode,
    chat_history: current.chatHistory,
    pending_prompt: current.pendingPrompt,
  });
  assertBridgeOk(response);

  const next = applyBridgeResult(current, response);
  getSessionStore().set(current.id, next);
  return toSnapshot(next, response.events);
}

export async function sendClassroomMessage(input: MessageInput): Promise<ClassroomSessionSnapshot> {
  const current = ensureSession(input.sessionId);
  const response = await runBridge({
    action: "message",
    session_id: current.id,
    source: "frontend",
    day_id: current.dayId,
    current_slide: normalizeSlide(input.currentSlide),
    text: input.text,
    target: input.target,
    chat_history: current.chatHistory,
    pending_prompt: current.pendingPrompt,
  });
  assertBridgeOk(response);

  const next = applyBridgeResult(current, response);
  getSessionStore().set(current.id, next);
  return toSnapshot(next, response.events);
}
