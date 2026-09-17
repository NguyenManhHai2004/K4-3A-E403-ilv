import type { AgentFilter, AgentKey } from "@/lib/types";

interface AgentSidebarProps {
  agentFilter: AgentFilter;
  historyTopics: string[];
  onSelect: (filter: AgentFilter) => void;
  onOpenProfile: (agent: AgentKey) => void;
  onOpenHistory: () => void;
}

const defaultHistoryTopics = [
  "Chuyển slide để các agent bắt đầu tương tác.",
  "Hỏi TA để được giải thích kỹ hơn về slide hiện tại.",
  "Gọi Material Bot để tạo quiz, flashcard hoặc mindmap.",
];

export function AgentSidebar({
  agentFilter,
  historyTopics,
  onSelect,
  onOpenProfile,
  onOpenHistory,
}: AgentSidebarProps) {
  const topics = historyTopics.length > 0 ? historyTopics : defaultHistoryTopics;

  return (
    <div className="agent-sidebar-panel">
      <div className="agent-cards-list">
        <div
          className={`agent-card${agentFilter === "all" ? " active" : ""}`}
          onClick={() => onSelect("all")}
        >
          <div className="agent-avatar-icon avatar-roundtable">✨</div>
          <div className="agent-meta">
            <div className="agent-name-row">
              <span className="agent-name">Lớp học chung</span>
              <span className="agent-role-pill" style={{ background: "rgba(19, 77, 139, 0.15)", color: "#134d8b" }}>
                3 Tác tử
              </span>
            </div>
            <div className="agent-status-text">Đang cùng thảo luận bài học</div>
          </div>
        </div>

        <div
          className={`agent-card teacher${agentFilter === "teacher" ? " active" : ""}`}
          onClick={() => onSelect("teacher")}
        >
          <div className="agent-avatar-icon avatar-teacher">👨‍🏫</div>
          <div className="agent-meta">
            <div className="agent-name-row">
              <span className="agent-name">TS. Minh</span>
              <span className="agent-role-pill role-teacher">Giảng viên</span>
            </div>
            <div className="agent-status-text">Giải đáp & phân tích bản chất</div>
          </div>
          <button
            className="agent-card-info-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile("teacher");
            }}
            title="Xem hồ sơ"
          >
            ⓘ
          </button>
        </div>

        <div
          className={`agent-card student${agentFilter === "student" ? " active" : ""}`}
          onClick={() => onSelect("student")}
        >
          <div className="agent-avatar-icon avatar-student">🎒</div>
          <div className="agent-meta">
            <div className="agent-name-row">
              <span className="agent-name">Bảo Nam</span>
              <span className="agent-role-pill role-student">Bạn học (Active)</span>
            </div>
            <div className="agent-status-text">Đố phản biện & gợi ý ôn tập</div>
          </div>
          <button
            className="agent-card-info-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile("student");
            }}
            title="Xem hồ sơ"
          >
            ⓘ
          </button>
        </div>

        <div
          className={`agent-card generator${agentFilter === "generator" ? " active" : ""}`}
          onClick={() => onSelect("generator")}
        >
          <div className="agent-avatar-icon avatar-generator">⚡</div>
          <div className="agent-meta">
            <div className="agent-name-row">
              <span className="agent-name">Nexus Bot</span>
              <span className="agent-role-pill role-gen">Sinh tài liệu</span>
            </div>
            <div className="agent-status-text">Tạo Quiz, Flashcard & Mindmap</div>
          </div>
          <button
            className="agent-card-info-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfile("generator");
            }}
            title="Xem hồ sơ"
          >
            ⓘ
          </button>
        </div>
      </div>

      <div className="chat-history-section">
        <div className="chat-history-section-head">
          <div className="sidebar-section-title" style={{ padding: "14px 0 8px 16px" }}>
            Chủ đề thảo luận gần đây
          </div>
          <button className="btn-view-all-history" onClick={onOpenHistory}>
            Xem tất cả
          </button>
        </div>
        <div className="history-list">
          {topics.map((topic, i) => (
            <div key={topic} className={`history-item${i === 0 ? " active" : ""}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>{topic}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
