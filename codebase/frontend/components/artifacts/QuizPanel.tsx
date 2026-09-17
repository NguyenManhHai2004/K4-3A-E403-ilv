"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import type { QuizArtifact } from "@/lib/types";

type Answered = Record<number, { choice: string; isCorrect: boolean } | undefined>;

interface QuizPanelProps {
  artifact: QuizArtifact | null;
}

export function QuizPanel({ artifact }: QuizPanelProps) {
  const [answered, setAnswered] = useState<Answered>({});
  const { showToast } = useToast();

  if (!artifact) {
    return (
      <div className="artifact-panel">
        <div className="panel-header">
          <span className="panel-badge quiz-badge">Quiz Ôn Tập Nhanh · Active Recall</span>
        </div>
        <div className="transcript-empty">
          Chưa có quiz nào được tạo. Hãy nhắn Material Bot với từ khóa `quiz` để sinh bộ câu hỏi thật từ slide hiện tại.
        </div>
      </div>
    );
  }

  const quizQuestions = artifact.content.items;
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
          Điểm: {score}/{artifact.item_count}
        </span>
      </div>

      {quizQuestions.map((q, i) => {
        const questionId = i + 1;
        const result = answered[questionId];
        return (
          <div
            key={`${artifact.title}-${questionId}`}
            className="quiz-question-box"
            style={i > 0 ? { borderTop: "1px solid var(--border-subtle)", paddingTop: 10 } : undefined}
          >
            <div className="quiz-question-title">
              <strong>Câu {questionId}:</strong> {q.question}
            </div>
            <div className="quiz-options">
              {q.options.map((opt, optionIndex) => {
                const optionKey = String.fromCharCode(65 + optionIndex);
                const isCorrect = opt === q.correct_option;
                let cls = "quiz-opt-btn";
                if (result) {
                  cls += " disabled";
                  if (optionKey === result.choice) cls += result.isCorrect ? " correct" : " wrong";
                }
                return (
                  <button
                    key={`${questionId}-${optionKey}`}
                    className={cls}
                    onClick={() => handleAnswer(questionId, optionKey, isCorrect)}
                  >
                    <span className="quiz-opt-key">{optionKey}</span> {opt}
                  </button>
                );
              })}
            </div>
            {result && (
              <div className={`quiz-feedback-box ${result.isCorrect ? "correct" : "wrong"}`}>
                {result.isCorrect ? "Chính xác. " : "Chưa đúng. "}
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
