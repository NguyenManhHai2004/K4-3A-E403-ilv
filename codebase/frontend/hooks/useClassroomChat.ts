"use client";

import { useMemo, useRef, useState } from "react";
import type {
  AgentFilter,
  AgentKey,
  ArtifactStore,
  ClassroomAgentEvent,
  ClassroomSessionSnapshot,
  LectureDayId,
  Message,
  PendingPrompt,
} from "@/lib/types";

const agentMeta: Record<
  AgentKey,
  { senderName: string; role: string; avatar: string }
> = {
  teacher: {
    senderName: "TS. Minh",
    role: "Giảng viên",
    avatar: "👨‍🏫",
  },
  student: {
    senderName: "Bảo Nam",
    role: "Bạn học (Active Recall)",
    avatar: "🎒",
  },
  generator: {
    senderName: "Nexus Bot",
    role: "Sinh tài liệu",
    avatar: "⚡",
  },
};

function emptyArtifacts(): ArtifactStore {
  return {
    quiz: null,
    flashcard: null,
    mindmap: null,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMessageHtml(text: string): string {
  return escapeHtml(text).replaceAll("\n", "<br />");
}

function currentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function typingLabelForFilter(target: AgentFilter): string {
  if (target === "teacher") return "TS. Minh đang phân tích slide hiện tại...";
  if (target === "student") return "Bảo Nam đang chuẩn bị câu hỏi Active Recall...";
  if (target === "generator") return "Nexus Bot đang sinh artifact thật từ nội dung slide...";
  return "Các agent đang đồng bộ với slide hiện tại...";
}

function eventToMessage(event: ClassroomAgentEvent, nextId: number): Message {
  const meta = agentMeta[event.agent];
  return {
    id: nextId,
    senderType: event.agent,
    senderName: meta.senderName,
    role: meta.role,
    avatar: meta.avatar,
    time: currentTimeString(),
    text: formatMessageHtml(event.reply),
    citation: event.citations.join(" • ") || undefined,
    activeRecallPrompt: Boolean(event.active_recall),
    hasArtifactNotice: event.agent === "generator",
  };
}

export function useClassroomChat(onArtifactCreated?: () => void) {
  const sessionIdRef = useRef<string | null>(null);
  const messageIdRef = useRef(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentFilter, setAgentFilterState] = useState<AgentFilter>("all");
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<ArtifactStore>(emptyArtifacts);
  const [historyTopics, setHistoryTopics] = useState<string[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null);
  const [sessionMeta, setSessionMeta] = useState({
    dayId: "day1" as LectureDayId,
    currentSlide: 1,
    currentSlideTitle: "",
    maxSlide: 1,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const visibleMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (agentFilter === "all") return true;
      if (msg.senderType === "user") return true;
      return msg.senderType === agentFilter;
    });
  }, [messages, agentFilter]);

  function nextMessageId(): number {
    messageIdRef.current += 1;
    return Date.now() + messageIdRef.current;
  }

  function applySnapshot(snapshot: ClassroomSessionSnapshot, replaceMessages: boolean) {
    sessionIdRef.current = snapshot.sessionId;
    setPendingPrompt(snapshot.pendingPrompt);
    setArtifacts(snapshot.artifacts);
    setHistoryTopics(snapshot.historyTopics);
    setSessionMeta({
      dayId: snapshot.dayId,
      currentSlide: snapshot.currentSlide,
      currentSlideTitle: snapshot.currentSlideTitle,
      maxSlide: snapshot.maxSlide,
    });

    const incomingMessages = snapshot.events
      .filter((event) => event.kind === "message" && event.reply.trim())
      .map((event) => eventToMessage(event, nextMessageId()));

    setMessages((prev) => (replaceMessages ? incomingMessages : [...prev, ...incomingMessages]));

    if (snapshot.events.some((event) => event.agent === "generator")) {
      onArtifactCreated?.();
    }
  }

  async function postSnapshot(body: Record<string, unknown>): Promise<ClassroomSessionSnapshot> {
    const response = await fetch("/api/classroom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message || "Không gọi được classroom API.");
    }

    return (await response.json()) as ClassroomSessionSnapshot;
  }

  async function bootstrapSession(dayId: LectureDayId, currentSlide: number, autoMode: AgentFilter = "all") {
    setIsBusy(true);
    setTypingLabel(typingLabelForFilter(autoMode));
    setErrorMessage(null);
    setMessages([]);
    setArtifacts(emptyArtifacts());
    setHistoryTopics([]);
    setPendingPrompt(null);

    try {
      const snapshot = await postSnapshot({
        action: "bootstrap",
        dayId,
        currentSlide,
        autoMode,
      });
      setAgentFilterState(autoMode);
      applySnapshot(snapshot, true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không khởi tạo được phiên classroom.");
    } finally {
      setTypingLabel(null);
      setIsBusy(false);
    }
  }

  async function syncSlide(currentSlide: number, autoMode: AgentFilter = agentFilter) {
    if (!sessionIdRef.current) return;

    setIsBusy(true);
    setTypingLabel(typingLabelForFilter(autoMode));
    setErrorMessage(null);

    try {
      const snapshot = await postSnapshot({
        action: "sync_slide",
        sessionId: sessionIdRef.current,
        currentSlide,
        autoMode,
      });
      applySnapshot(snapshot, false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không đồng bộ được slide.");
    } finally {
      setTypingLabel(null);
      setIsBusy(false);
    }
  }

  async function sendMessage(text: string, target: AgentFilter, currentSlide: number) {
    const trimmed = text.trim();
    if (!trimmed || !sessionIdRef.current) return;

    setMessages((prev) => [
      ...prev,
      {
        id: nextMessageId(),
        senderType: "user",
        senderName: "Bạn (Học viên)",
        role: "Học viên",
        avatar: "HV",
        time: currentTimeString(),
        text: formatMessageHtml(trimmed),
      },
    ]);
    setIsBusy(true);
    setTypingLabel(typingLabelForFilter(target));
    setErrorMessage(null);

    try {
      const snapshot = await postSnapshot({
        action: "message",
        sessionId: sessionIdRef.current,
        currentSlide,
        target,
        text: trimmed,
      });
      applySnapshot(snapshot, false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không gửi được tin nhắn.");
    } finally {
      setTypingLabel(null);
      setIsBusy(false);
    }
  }

  async function changeAgentFilter(nextFilter: AgentFilter, currentSlide: number) {
    setAgentFilterState(nextFilter);
    await syncSlide(currentSlide, nextFilter);
  }

  async function resetConversation(dayId: LectureDayId, currentSlide: number) {
    await bootstrapSession(dayId, currentSlide, agentFilter);
  }

  return {
    messages: visibleMessages,
    agentFilter,
    typingLabel,
    artifacts,
    historyTopics,
    pendingPrompt,
    sessionMeta,
    errorMessage,
    isBusy,
    bootstrapSession,
    syncSlide,
    sendMessage,
    changeAgentFilter,
    resetConversation,
  };
}
