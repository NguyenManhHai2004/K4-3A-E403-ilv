"use client";

import { chatHistorySessions } from "@/lib/mock-data";
import type { AgentKey } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";

interface ChatHistoryDrawerProps {
  onClose: () => void;
}

const agentLabel: Record<AgentKey, string> = {
  teacher: "👨‍🏫 TS. Minh",
  student: "🎒 Bảo Nam",
  generator: "⚡ Nexus Bot",
};

export function ChatHistoryDrawer({ onClose }: ChatHistoryDrawerProps) {
  const { showToast } = useToast();

  const groups = chatHistorySessions.reduce<Record<string, typeof chatHistorySessions>>((acc, session) => {
    (acc[session.date] ??= []).push(session);
    return acc;
  }, {});

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
          {Object.entries(groups).map(([date, sessions]) => (
            <div key={date}>
              <div className="history-drawer-day-label">{date}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {sessions.map((session, i) => (
                  <div
                    key={i}
                    className="history-drawer-item"
                    onClick={() => showToast(`Đang tải lại phiên: "${session.topic}"...`)}
                  >
                    <span className="agent-status-text">{agentLabel[session.agent]}</span>
                    <span className="history-drawer-item-topic">{session.topic}</span>
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
