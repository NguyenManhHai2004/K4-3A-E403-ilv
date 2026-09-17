"use client";

import { useState } from "react";
import Link from "next/link";
import { useClassroomChat } from "@/hooks/useClassroomChat";
import { useToast } from "@/components/ui/ToastProvider";
import { AgentSidebar } from "./AgentSidebar";
import { ChatStream } from "./ChatStream";
import { ChatComposer } from "./ChatComposer";
import { ArtifactsSidebar } from "./ArtifactsSidebar";
import type { AgentFilter, ArtifactFilter } from "@/lib/types";

const modeTabs: { key: AgentFilter; label: string }[] = [
  { key: "all", label: "Thảo luận chung (Round-table)" },
  { key: "teacher", label: "👨‍🏫 Giảng viên" },
  { key: "student", label: "🎒 Bạn học" },
  { key: "generator", label: "⚡ Material Bot" },
];

export function ClassroomView() {
  const [docCount, setDocCount] = useState(3);
  const [highlighted, setHighlighted] = useState(false);
  const [artifactFilter, setArtifactFilter] = useState<ArtifactFilter>("all");
  const { showToast } = useToast();

  const { messages, agentFilter, setAgentFilter, typingLabel, sendMessage, resetConversation } =
    useClassroomChat(() => {
      setDocCount(4);
      setHighlighted(true);
      showToast("⚡ Artifacts mới đã được tạo vào Sidebar phải!");
    });

  function handleReset() {
    resetConversation();
    setDocCount(3);
    setHighlighted(false);
    setArtifactFilter("all");
    showToast("Đã nạp lại kịch bản mẫu ban đầu!");
  }

  return (
    <main className="view-container classroom-view active-view">
      <div className="classroom-top-bar">
        <Link href="/" className="back-to-lesson-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Quay lại bài giảng (Slide)
        </Link>

        <div className="classroom-status-group">
          <div className="live-badge">
            <div className="live-dot"></div>
            <span>3 Agents đang trực tuyến cùng bạn</span>
          </div>

          <div className="classroom-mode-select">
            {modeTabs.map((tab) => (
              <button
                key={tab.key}
                className={`mode-tab${agentFilter === tab.key ? " active" : ""}`}
                onClick={() => setAgentFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="back-to-lesson-btn"
          style={{ color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.3)" }}
          onClick={handleReset}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"></polyline>
            <polyline points="23 20 23 14 17 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
          </svg>
          Tải lại kịch bản mẫu
        </button>
      </div>

      <div className="classroom-grid">
        <AgentSidebar agentFilter={agentFilter} onSelect={setAgentFilter} />

        <section className="col-chat-main">
          <ChatStream
            messages={messages}
            typingLabel={typingLabel}
            onPreviewArtifacts={() => setArtifactFilter("all")}
          />
          <ChatComposer onSend={sendMessage} />
        </section>

        <ArtifactsSidebar
          filter={artifactFilter}
          onFilterChange={setArtifactFilter}
          docCount={docCount}
          highlighted={highlighted}
        />
      </div>
    </main>
  );
}
