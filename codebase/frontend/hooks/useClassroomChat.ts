"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const CLASSROOM_WS_URL = process.env.NEXT_PUBLIC_AGENTS_WS_URL ?? "ws://localhost:8000/ws/classroom";

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
    role: "Bạn học",
    avatar: "🎒",
  },
  generator: {
    senderName: "Nexus Bot",
    role: "Sinh tài liệu",
    avatar: "⚡",
  },
};

interface ClassroomSocketSnapshotEnvelope {
  kind: "snapshot";
  request_id: string;
  snapshot: ClassroomSessionSnapshot;
}

interface ClassroomSocketErrorEnvelope {
  kind: "error";
  request_id: string;
  message: string;
}

type ClassroomSocketEnvelope = ClassroomSocketSnapshotEnvelope | ClassroomSocketErrorEnvelope;

type PendingSocketRequest = {
  resolve: (snapshot: ClassroomSessionSnapshot) => void;
  reject: (error: Error) => void;
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

function nextRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function typingLabelForFilter(target: AgentFilter): string {
  if (target === "teacher") return "TS. Minh đang phân tích slide hiện tại...";
  if (target === "student") return "Bảo Nam đang chuẩn bị câu hỏi Active Recall...";
  if (target === "generator") return "Nexus Bot đang sinh artifact thật từ nội dung slide...";
  return "Các agent đang đồng bộ với slide hiện tại...";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function resolveReplyTo(replyToId: string | number | undefined, messageList: Message[]): Message["replyTo"] {
  if (replyToId == null) return undefined;
  const target = messageList.find((m) => String(m.id) === String(replyToId));
  if (!target) return undefined;
  return {
    id: target.id,
    senderName: target.senderName,
    text: stripHtml(target.text),
  };
}

function eventToMessage(event: ClassroomAgentEvent, nextId: string | number, messageList: Message[] = []): Message {
  const meta = agentMeta[event.agent];
  return {
    id: event.id ?? nextId,
    senderType: event.agent,
    senderName: meta.senderName,
    role: meta.role,
    avatar: meta.avatar,
    time: currentTimeString(),
    text: formatMessageHtml(event.reply),
    citation: event.citations.join(" • ") || undefined,
    activeRecallPrompt: Boolean(event.active_recall),
    hasArtifactNotice: event.agent === "generator",
    replyTo: resolveReplyTo(event.reply_to_id, messageList),
  };
}

export function useClassroomChat(onArtifactCreated?: () => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const pendingRequestsRef = useRef<Map<string, PendingSocketRequest>>(new Map());
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
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const visibleMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (agentFilter === "all") return true;
      if (msg.senderType === "user") return true;
      return msg.senderType === agentFilter;
    });
  }, [messages, agentFilter]);

  function rejectPendingRequests(message: string) {
    for (const [requestId, pending] of pendingRequestsRef.current.entries()) {
      pending.reject(new Error(message));
      pendingRequestsRef.current.delete(requestId);
    }
  }

  function closeSocket() {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }

  function nextMessageId(): string {
    messageIdRef.current += 1;
    return `msg_${Date.now()}_${messageIdRef.current}`;
  }

  function applySnapshot(snapshot: ClassroomSessionSnapshot, replaceMessages: boolean) {
    setPendingPrompt(snapshot.pendingPrompt);
    setArtifacts(snapshot.artifacts);
    setHistoryTopics(snapshot.historyTopics);
    setSessionMeta({
      dayId: snapshot.dayId,
      currentSlide: snapshot.currentSlide,
      currentSlideTitle: snapshot.currentSlideTitle,
      maxSlide: snapshot.maxSlide,
    });

    setMessages((prev) => {
      const list = replaceMessages ? [] : [...prev];
      for (const event of snapshot.events) {
        if (event.kind === "message" && event.reply.trim()) {
          const msg = eventToMessage(event, nextMessageId(), list);
          list.push(msg);
        }
      }
      return list;
    });

    if (snapshot.events.some((event) => event.agent === "generator")) {
      onArtifactCreated?.();
    }
  }

  function handleSocketMessage(event: MessageEvent<string>) {
    let payload: ClassroomSocketEnvelope;
    try {
      payload = JSON.parse(event.data) as ClassroomSocketEnvelope;
    } catch {
      setErrorMessage("Nhận được dữ liệu không hợp lệ từ classroom websocket.");
      return;
    }

    const pending = pendingRequestsRef.current.get(payload.request_id);
    if (!pending) {
      if (payload.kind === "error") {
        setErrorMessage(payload.message || "Classroom websocket failed.");
        return;
      }
      setErrorMessage(null);
      applySnapshot(payload.snapshot, false);
      return;
    }
    pendingRequestsRef.current.delete(payload.request_id);

    if (payload.kind === "error") {
      pending.reject(new Error(payload.message || "Classroom websocket failed."));
      return;
    }

    pending.resolve(payload.snapshot);
  }

  function connectSocket(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(CLASSROOM_WS_URL);
      let settled = false;

      socket.onmessage = handleSocketMessage;
      socket.onerror = () => {
        if (!settled) {
          reject(new Error("Không kết nối được classroom websocket backend."));
          return;
        }
        setErrorMessage("Kết nối classroom websocket gặp lỗi.");
      };
      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        rejectPendingRequests("Kết nối classroom websocket đã đóng. Hãy khởi tạo lại classroom.");
        if (!settled) {
          reject(new Error("Classroom websocket đã đóng trước khi khởi tạo xong."));
        }
      };
      socket.onopen = () => {
        settled = true;
        socketRef.current = socket;
        resolve(socket);
      };
    });
  }

  async function sendSocketRequest(
    socket: WebSocket,
    payload: Record<string, unknown>,
  ): Promise<ClassroomSessionSnapshot> {
    if (socket.readyState !== WebSocket.OPEN) {
      throw new Error("Classroom websocket chưa sẵn sàng.");
    }

    const requestId = nextRequestId();
    return await new Promise<ClassroomSessionSnapshot>((resolve, reject) => {
      pendingRequestsRef.current.set(requestId, { resolve, reject });
      socket.send(
        JSON.stringify({
          ...payload,
          request_id: requestId,
          source: "frontend_websocket",
        }),
      );
    });
  }

  function requireOpenSocket(): WebSocket {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("Phiên classroom websocket không còn hoạt động. Hãy khởi tạo lại classroom.");
    }
    return socket;
  }

  async function bootstrapSession(dayId: LectureDayId, currentSlide: number, autoMode: AgentFilter = "all") {
    closeSocket();
    setIsBusy(true);
    setTypingLabel(typingLabelForFilter(autoMode));
    setErrorMessage(null);
    setMessages([]);
    setArtifacts(emptyArtifacts());
    setHistoryTopics([]);
    setPendingPrompt(null);

    try {
      const socket = await connectSocket();
      const snapshot = await sendSocketRequest(socket, {
        action: "bootstrap",
        dayId,
        currentSlide,
        autoMode,
      });
      setAgentFilterState(autoMode);
      applySnapshot(snapshot, true);
    } catch (error) {
      closeSocket();
      setErrorMessage(error instanceof Error ? error.message : "Không khởi tạo được phiên classroom.");
    } finally {
      setTypingLabel(null);
      setIsBusy(false);
    }
  }

  async function syncSlide(currentSlide: number, autoMode: AgentFilter = agentFilter) {
    setIsBusy(true);
    setTypingLabel(typingLabelForFilter(autoMode));
    setErrorMessage(null);

    try {
      const snapshot = await sendSocketRequest(requireOpenSocket(), {
        action: "sync_slide",
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

  async function sendMessage(
    text: string,
    target: AgentFilter,
    currentSlide: number,
    replyToMessage?: Message | null,
  ) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const targetReply = replyToMessage ?? replyingTo;
    const userMsgId = `msg_${Date.now()}_${messageIdRef.current + 1}`;
    messageIdRef.current += 1;
    const userReplyTo = targetReply
      ? {
          id: targetReply.id,
          senderName: targetReply.senderName,
          text: stripHtml(targetReply.text),
        }
      : undefined;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        senderType: "user",
        senderName: "Bạn (Học viên)",
        role: "Học viên",
        avatar: "HV",
        time: currentTimeString(),
        text: formatMessageHtml(trimmed),
        replyTo: userReplyTo,
      },
    ]);
    setReplyingTo(null);
    setIsBusy(true);
    setTypingLabel(typingLabelForFilter(target));
    setErrorMessage(null);

    try {
      const snapshot = await sendSocketRequest(requireOpenSocket(), {
        action: "message",
        currentSlide,
        target,
        text: trimmed,
        message_id: userMsgId,
        reply_to_id: targetReply ? targetReply.id : undefined,
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

  useEffect(() => {
    return () => {
      closeSocket();
      rejectPendingRequests("Phiên classroom đã bị hủy.");
    };
  }, []);

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
    replyingTo,
    setReplyingTo,
    cancelReply: () => setReplyingTo(null),
    bootstrapSession,
    syncSlide,
    sendMessage,
    changeAgentFilter,
    resetConversation,
  };
}
