"use client";

import { useState } from "react";
import { quizQuestions } from "@/lib/mock-data";
import { useToast } from "@/components/ui/ToastProvider";

type Answered = Record<number, { choice: string; isCorrect: boolean } | undefined>;

export function QuizPanel() {
  const [answered, setAnswered] = useState<Answered>({});
  const { showToast } = useToast();

  const score = Object.values(answered).filter((a) => a?.isCorrect).length;

  function handleAnswer(qId: number, choice: string, isCorrect: boolean) {
    if (answered[qId]) return;
    setAnswered((prev) => ({ ...prev, [qId]: { choice, isCorrect } }));
    showToast(`Bạn đã hoàn thành câu hỏi ${qId}!`);
  }

  return (
    <div className="artifact-panel">
      <div className="panel-header">
        <span className="panel-badge quiz-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Quiz Ôn Tập Nhanh · Active Recall
        </span>
        <span className="quiz-score-live">
          Điểm: {score}/{quizQuestions.length}
        </span>
      </div>

      {quizQuestions.map((q, i) => {
        const result = answered[q.id];
        return (
          <div
            key={q.id}
            className="quiz-question-box"
            style={i > 0 ? { borderTop: "1px solid var(--border-subtle)", paddingTop: 10 } : undefined}
          >
            <div className="quiz-question-title">
              <strong>Câu {q.id}:</strong> <span dangerouslySetInnerHTML={{ __html: q.prompt }} />
            </div>
            <div className="quiz-options">
              {q.options.map((opt) => {
                let cls = "quiz-opt-btn";
                if (result) {
                  cls += " disabled";
                  if (opt.key === result.choice) cls += result.isCorrect ? " correct" : " wrong";
                }
                return (
                  <button
                    key={opt.key}
                    className={cls}
                    onClick={() => handleAnswer(q.id, opt.key, opt.isCorrect)}
                  >
                    <span className="quiz-opt-key">{opt.key}</span> {opt.text}
                  </button>
                );
              })}
            </div>
            {result && (
              <div
                className={`quiz-feedback-box ${result.isCorrect ? "correct" : "wrong"}`}
                dangerouslySetInnerHTML={{
                  __html: result.isCorrect ? q.correctFeedback : q.wrongFeedback,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
