import type { LectureDay } from "@/lib/lecture-data";

interface LessonSidebarProps {
  days: LectureDay[];
  activeDayId: LectureDay["id"];
  onSelectDay: (id: LectureDay["id"]) => void;
}

export function LessonSidebar({ days, activeDayId, onSelectDay }: LessonSidebarProps) {
  const activeIndex = days.findIndex((d) => d.id === activeDayId);
  const progressPercent = ((activeIndex + 1) / days.length) * 100;

  return (
    <aside className="lesson-sidebar">
      <div className="course-header">
        <div className="course-badge">Data Pack · VLearn Hackathon</div>
        <h2 className="course-title">AI20K · Lecture Pack</h2>
        <div className="progress-bar-container">
          <div className="progress-labels">
            <span>Tiến độ học</span>
            <span>
              {activeIndex + 1}/{days.length} buổi
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="lesson-list">
        {days.map((day, i) => (
          <button
            key={day.id}
            className={`lesson-item${day.id === activeDayId ? " active" : ""}`}
            onClick={() => onSelectDay(day.id)}
          >
            <div className="lesson-number">{String(i + 1).padStart(2, "0")}</div>
            <div className="lesson-info">
              <div className="lesson-name">{day.label}</div>
              <div className="lesson-meta">
                <span>{day.transcripts.length} transcript</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
