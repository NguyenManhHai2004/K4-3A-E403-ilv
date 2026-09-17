"use client";

import { lessons } from "@/lib/mock-data";
import { useToast } from "@/components/ui/ToastProvider";

interface LessonSidebarProps {
  activeLesson: number;
  onSelectLesson: (num: number) => void;
}

export function LessonSidebar({ activeLesson, onSelectLesson }: LessonSidebarProps) {
  const { showToast } = useToast();

  function handleSelect(num: number) {
    onSelectLesson(num);
    if (num === 1) {
      showToast("Đang mở Bài 1: Cơ chế Attention & Transformer");
    } else {
      showToast(`Bài ${num} đang được khóa hoặc là bài tiếp theo trong lộ trình.`);
    }
  }

  return (
    <aside className="lesson-sidebar">
      <div className="course-header">
        <div className="course-badge">Khóa học Chuyên đề</div>
        <h2 className="course-title">AI20K · Kiến trúc LLM & Multi-Agent Systems</h2>
        <div className="progress-bar-container">
          <div className="progress-labels">
            <span>Tiến độ học</span>
            <span>45% (2/4 bài)</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>

      <div className="lesson-list">
        {lessons.map((lesson) => (
          <button
            key={lesson.number}
            className={`lesson-item${lesson.number === activeLesson ? " active" : ""}`}
            onClick={() => handleSelect(lesson.number)}
          >
            <div className="lesson-number">{String(lesson.number).padStart(2, "0")}</div>
            <div className="lesson-info">
              <div className="lesson-name">{lesson.name}</div>
              <div className="lesson-meta">
                <span>{lesson.status}</span> • <span>{lesson.slideCount} slides</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
