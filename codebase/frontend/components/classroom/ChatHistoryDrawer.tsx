"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchConversationHistory } from "@/lib/agents-api";
import type { ConversationHistorySummary, ConversationScope, LectureDayId } from "@/lib/types";

interface ChatHistoryDrawerProps {
  artifactId: LectureDayId;
  onClose: () => void;
}

const scopeLabel: Record<ConversationScope, string> = {
  shared: "✨ Lớp học chung",
  private_ta: "👨‍🏫 TS. Minh",
  private_student: "🎒 Bảo Nam",
  material: "⚡ Nexus Bot",
};

function groupLabelFromIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không rõ thời gian";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((today - target) / 86400000);

  if (dayDiff === 0) return "Hôm nay";
  if (dayDiff === 1) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function timeLabelFromIso(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatHistoryDrawer({ artifactId, onClose }: ChatHistoryDrawerProps) {
  const [items, setItems] = useState<ConversationHistorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setIsLoading(true);
      setErrorMessage(null);
      const conversations = await fetchConversationHistory(artifactId);
      if (cancelled) return;
      setItems(conversations);
      setIsLoading(false);
    }

    loadHistory().catch((error) => {
      if (cancelled) return;
      setErrorMessage(error instanceof Error ? error.message : "Không tải được conversation history.");
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [artifactId]);

  const groups = useMemo(() => {
    return items.reduce<Record<string, ConversationHistorySummary[]>>((acc, session) => {
      const label = groupLabelFromIso(session.updated_at);
      (acc[label] ??= []).push(session);
      return acc;
    }, {});
  }, [items]);

  return (
    <>
      <div className="history-drawer-backdrop" onClick={onClose} />
      <div className="history-drawer">
        <div className="history-drawer-head">
          <span className="history-drawer-title">Lịch sử trò chuyện</span>
          <button className="history-drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="history-drawer-body">
          {isLoading && <div className="transcript-empty">Đang tải conversation history từ database...</div>}
          {!isLoading && errorMessage && <div className="transcript-empty">{errorMessage}</div>}
          {!isLoading && !errorMessage && items.length === 0 && (
            <div className="transcript-empty">Chưa có conversation history nào được lưu cho lesson này.</div>
          )}
          {!isLoading && !errorMessage && Object.entries(groups).map(([date, sessions]) => (
            <div key={date}>
              <div className="history-drawer-day-label">{date}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {sessions.map((session) => (
                  <div key={session.id} className="history-drawer-item">
                    <span className="agent-status-text">{scopeLabel[session.scope]}</span>
                    <span className="history-drawer-item-topic">{session.topic || "(Không có preview)"}</span>
                    <span className="agent-status-text">
                      {timeLabelFromIso(session.updated_at)} · {session.message_count} lượt trao đổi
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
