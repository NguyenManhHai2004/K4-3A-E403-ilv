"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import type { FlashcardArtifact } from "@/lib/types";

interface FlashcardPanelProps {
  artifact: FlashcardArtifact | null;
}

export function FlashcardPanel({ artifact }: FlashcardPanelProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const { showToast } = useToast();

  if (!artifact || artifact.content.items.length === 0) {
    return (
      <div className="artifact-panel">
        <div className="panel-header">
          <span className="panel-badge flashcard-badge">3D Flashcards · Bấm để lật thẻ</span>
        </div>
        <div className="transcript-empty">
          Chưa có flashcard nào. Hãy nhờ Material Bot tạo `flashcard` để bổ sung bộ thẻ ôn tập cho phần đã học.
        </div>
      </div>
    );
  }

  const cards = artifact.content.items;
  const card = cards[index];

  function navigate(delta: number) {
    setFlipped(false);
    setTimeout(() => {
      setIndex((prev) => (prev + delta + cards.length) % cards.length);
    }, 150);
  }

  function markLearned() {
    showToast(`✓ Đã đánh dấu nhớ thẻ "${card.front}"!`);
    navigate(1);
  }

  return (
    <div className="artifact-panel">
      <div className="panel-header">
        <span className="panel-badge flashcard-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          3D Flashcards · Bấm để lật thẻ
        </span>
        <span className="fc-counter">
          Thẻ {index + 1} / {artifact.item_count}
        </span>
      </div>

      <div className="flashcard-stage" onClick={() => setFlipped((f) => !f)}>
        <div className={`flashcard-inner${flipped ? " flipped" : ""}`}>
          <div className="flashcard-face flashcard-front">
            <div className="fc-tag">Khái niệm cốt lõi</div>
            <div className="fc-main-term">{card.front}</div>
            <div className="fc-flip-hint">👆 Bấm vào đây để xem định nghĩa & công thức</div>
          </div>
          <div className="flashcard-face flashcard-back">
            <div className="fc-tag" style={{ color: "var(--student-color)" }}>
              Định nghĩa & Bản chất
            </div>
            <div className="fc-back-definition">{card.back}</div>
            <div className="fc-flip-hint" style={{ color: "var(--student-color)" }}>
              👆 Bấm để lật lại mặt trước
            </div>
          </div>
        </div>
      </div>

      <div className="flashcard-nav-row">
        <button className="fc-btn-arrow" onClick={() => navigate(-1)}>
          ◀ Thẻ trước
        </button>
        <button
          className="fc-btn-arrow"
          style={{ background: "var(--student-light)", color: "var(--student-color)", borderColor: "var(--student-color)" }}
          onClick={markLearned}
        >
          ✓ Đã thuộc
        </button>
        <button className="fc-btn-arrow" onClick={() => navigate(1)}>
          Thẻ tiếp theo ▶
        </button>
      </div>
    </div>
  );
}
