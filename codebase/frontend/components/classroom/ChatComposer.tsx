"use client";

import { useEffect, useState } from "react";
import type { AgentFilter } from "@/lib/types";

interface ChatComposerProps {
  defaultTarget?: AgentFilter;
  onSend: (text: string, target: AgentFilter) => void;
}

const quickPrompts: { type: string; className: string; label: string; text: string; target: AgentFilter }[] = [
  {
    type: "answer_dk",
    className: "student-chip",
    label: '🎯 Trả lời bạn học: "Vì để tránh triệt tiêu gradient khi dk lớn"',
    text: "Bởi vì khi chiều dài dk lớn, tích vô hướng Q·K^T sẽ có độ biến thiên rất lớn, đẩy hàm Softmax vào vùng cực dốc khiến gradient bị triệt tiêu (bão hòa), làm việc học bị đình trệ!",
    target: "student",
  },
  {
    type: "ask_multihead",
    className: "teacher-chip",
    label: '💡 Hỏi Giảng viên: "Tại sao cần dùng Multi-Head thay vì 1 Head?"',
    text: "Thầy Minh ơi, tại sao người ta lại chia thành nhiều Head (Multi-Head) thay vì chỉ dùng 1 Head có kích thước lớn?",
    target: "teacher",
  },
  {
    type: "gen_quiz",
    className: "gen-chip",
    label: '📝 Yêu cầu Bot: "Tạo thêm 3 câu Quiz trắc nghiệm"',
    text: "Nexus ơi, nhờ bạn sinh thêm cho mình 2 câu Quiz nâng cao về Multi-Head Attention nhé!",
    target: "generator",
  },
  {
    type: "gen_mindmap",
    className: "gen-chip",
    label: '🧠 Yêu cầu Bot: "Mở rộng Mindmap sang Multi-Head"',
    text: "Nexus ơi, cập nhật Mindmap mở rộng thêm nhánh Multi-Head Attention giúp mình!",
    target: "generator",
  },
];

export function ChatComposer({ defaultTarget = "all", onSend }: ChatComposerProps) {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<AgentFilter>(defaultTarget);

  useEffect(() => {
    setTarget(defaultTarget);
  }, [defaultTarget]);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, target);
    setText("");
  }

  return (
    <div className="chat-bottom-dock">
      <div className="quick-chips-row">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt.type}
            className={`quick-chip ${prompt.className}`}
            onClick={() => {
              setTarget(prompt.target);
              onSend(prompt.text, prompt.target);
            }}
          >
            {prompt.label}
          </button>
        ))}
      </div>

      <div className="input-compose-box">
        <select
          className="target-agent-select"
          value={target}
          onChange={(e) => setTarget(e.target.value as AgentFilter)}
        >
          <option value="all">@Tất cả Agents</option>
          <option value="teacher">@TS. Minh (Giảng viên)</option>
          <option value="student">@Bảo Nam (Bạn học)</option>
          <option value="generator">@Nexus (Tạo tài liệu)</option>
        </select>

        <input
          type="text"
          className="chat-text-input"
          placeholder="Nhập câu hỏi, câu trả lời hoặc yêu cầu tạo tài liệu ôn tập..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />

        <button className="btn-send-message" onClick={submit} title="Gửi tin nhắn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}
