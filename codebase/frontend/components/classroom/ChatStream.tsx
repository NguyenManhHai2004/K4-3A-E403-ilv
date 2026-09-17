"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";

interface ChatStreamProps {
  messages: Message[];
  typingLabel: string | null;
  onPreviewArtifacts: () => void;
}

function roleBadgeClass(senderType: Message["senderType"]): string {
  if (senderType === "student") return "role-student";
  if (senderType === "generator") return "role-gen";
  return "role-teacher";
}

export function ChatStream({ messages, typingLabel, onPreviewArtifacts }: ChatStreamProps) {
  const streamRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typingLabel]);

  return (
    <>
      <div className="chat-stream" ref={streamRef}>
        {messages.map((msg) => {
          const isUser = msg.senderType === "user";
          return (
            <div key={msg.id} className={`msg-row${isUser ? " user" : ""}`}>
              <div className={`msg-avatar${isUser ? " user-av" : " avatar-" + msg.senderType}`}>
                {isUser ? "HV" : msg.avatar}
              </div>
              <div className="msg-content-block">
                <div className="msg-author-tag">
                  <span className="msg-author-name">{msg.senderName}</span>
                  {!isUser && (
                    <span className={`msg-role-badge ${roleBadgeClass(msg.senderType)}`}>{msg.role}</span>
                  )}
                  <span className="msg-time">{msg.time}</span>
                </div>
                <div className={`msg-bubble ${msg.senderType}`}>
                  <span dangerouslySetInnerHTML={{ __html: msg.text }} />

                  {msg.activeRecallPrompt && (
                    <div className="active-recall-box">
                      🎯 <strong>Thử thách Active Recall:</strong> Bạn hãy thử tự trả lời câu hỏi của bạn Nam xem
                      sao! Nhớ lại kiến thức mà không nhìn sách là cách ghi nhớ tốt nhất.
                    </div>
                  )}

                  {msg.hasArtifactNotice && (
                    <div className="artifact-notification-card">
                      <span style={{ fontSize: 12, color: "#f59e0b" }}>
                        ✨ Đã tự động tạo: Quiz & Flashcard về Attention
                      </span>
                      <button
                        className="artifact-btn-preview"
                        onClick={() => {
                          onPreviewArtifacts();
                          showToast("Đang mở Kho Artifacts...");
                        }}
                      >
                        Xem ngay ➔
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`typing-row${typingLabel ? " show" : ""}`}>
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span>{typingLabel ?? "AI đang trả lời..."}</span>
      </div>
    </>
  );
}
