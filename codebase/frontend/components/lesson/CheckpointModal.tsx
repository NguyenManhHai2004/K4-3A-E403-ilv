"use client";

import { useState } from "react";
import type { Checkpoint } from "@/lib/types";

interface CheckpointModalProps {
  checkpoint: Checkpoint;
  onDone: () => void;
}

export function CheckpointModal({ checkpoint, onDone }: CheckpointModalProps) {
  const [answer, setAnswer] = useState<{ key: string; isCorrect: boolean } | null>(null);

  return (
    <div className="checkpoint-backdrop">
      <div className="checkpoint-card">
        <div className="checkpoint-top">
          <span className="checkpoint-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Checkpoint kiểm tra nhanh
          </span>
          <div className="checkpoint-top-actions">
            {!answer && (
              <button className="checkpoint-skip" onClick={onDone}>
                Bỏ qua
              </button>
            )}
          </div>
        </div>

        <div className="checkpoint-question">{checkpoint.question}</div>

        <div className="quiz-options">
          {checkpoint.options.map((opt) => {
            let cls = "quiz-opt-btn";
            if (answer) {
              cls += " disabled";
              if (opt.key === answer.key) cls += answer.isCorrect ? " correct" : " wrong";
            }
            return (
              <button
                key={opt.key}
                className={cls}
                onClick={() => !answer && setAnswer({ key: opt.key, isCorrect: opt.isCorrect })}
              >
                <span className="quiz-opt-key">{opt.key}</span> {opt.text}
              </button>
            );
          })}
        </div>

        {answer && (
          <div className={`quiz-feedback-box ${answer.isCorrect ? "correct" : "wrong"}`}>
            {answer.isCorrect ? "🎉 Chính xác! Tiếp tục bài giảng nhé." : "❌ Chưa đúng, xem lại phần vừa qua nhé."}
          </div>
        )}

        {answer && (
          <button className="btn-slide-nav" onClick={onDone}>
            Tiếp tục ▶
          </button>
        )}
      </div>
    </div>
  );
}
