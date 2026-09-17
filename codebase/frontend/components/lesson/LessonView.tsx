"use client";

import { useState } from "react";
import Link from "next/link";
import { checkpointsByDay } from "@/lib/mock-data";
import { lectureDays, type LectureDay } from "@/lib/lecture-data";
import { LessonSidebar } from "./LessonSidebar";
import { PdfSlideStage } from "./PdfSlideStage";
import { SlideFooterNav } from "./SlideFooterNav";
import { CheckpointModal } from "./CheckpointModal";
import { TranscriptPanel } from "@/components/lecture/TranscriptPanel";
import { useToast } from "@/components/ui/ToastProvider";

interface LessonViewProps {
  transcriptContents: Record<string, string>;
}

export function LessonView({ transcriptContents }: LessonViewProps) {
  const [dayId, setDayId] = useState<LectureDay["id"]>(lectureDays[0].id);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [answeredCheckpointIds, setAnsweredCheckpointIds] = useState<Set<number>>(new Set());
  const [activeCheckpointId, setActiveCheckpointId] = useState<number | null>(null);
  const { showToast } = useToast();

  const day = lectureDays.find((d) => d.id === dayId) ?? lectureDays[0];
  const [transcriptId, setTranscriptId] = useState(day.transcripts[0]?.id);
  const activeTranscript = day.transcripts.find((t) => t.id === transcriptId) ?? day.transcripts[0];

  const checkpoints = checkpointsByDay[dayId] ?? [];
  const activeCheckpoint = checkpoints.find((c) => c.id === activeCheckpointId) ?? null;

  function handleSelectDay(id: LectureDay["id"]) {
    const nextDay = lectureDays.find((d) => d.id === id);
    if (!nextDay) return;
    setDayId(id);
    setPageIndex(0);
    setTranscriptId(nextDay.transcripts[0]?.id);
    setAnsweredCheckpointIds(new Set());
    setActiveCheckpointId(null);
  }

  function changePage(delta: number) {
    const newIndex = pageIndex + delta;
    if (newIndex >= 0 && newIndex < pageCount) {
      setPageIndex(newIndex);
      const match = checkpoints.find((c) => c.pageIndex === newIndex && !answeredCheckpointIds.has(c.id));
      if (match) setActiveCheckpointId(match.id);
    }
  }

  function handleCheckpointDone() {
    if (activeCheckpointId !== null) {
      setAnsweredCheckpointIds((prev) => new Set(prev).add(activeCheckpointId));
    }
    setActiveCheckpointId(null);
  }

  return (
    <main className="view-container lesson-view active-view">
      <LessonSidebar days={lectureDays} activeDayId={dayId} onSelectDay={handleSelectDay} />

      <section className="lesson-main">
        <div className="lesson-content-header">
          <div>
            <div className="lesson-breadcrumb">
              <span>Khóa học AI</span> / <span>{day.label}</span>
            </div>
            <h1 className="lesson-main-title">{day.label}</h1>
          </div>

          <Link
            href="/classroom"
            className="btn-enter-classroom"
            onClick={() => showToast("✨ Đã vào chế độ Multi-Agent Classroom!")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Bật Multi-Agent Classroom
          </Link>
        </div>

        <div className="slide-stage-wrapper">
          <div className="lecture-day-tabs">
            {lectureDays.map((d) => (
              <button
                key={d.id}
                className={`lecture-day-tab${d.id === dayId ? " active" : ""}`}
                onClick={() => handleSelectDay(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="lecture-screen-wrapper">
            <div className="lecture-screen-label">🎬 Màn chiếu</div>
            <PdfSlideStage objectUrl={day.slidePdfPath} pageIndex={pageIndex} onPageCount={setPageCount} />
            <SlideFooterNav
              index={pageIndex}
              total={pageCount}
              onPrev={() => changePage(-1)}
              onNext={() => changePage(1)}
            />
          </div>

          <div className="lecture-transcript-section">
            <div className="lecture-transcript-head">
              <span className="lecture-transcript-title">📝 Transcript bài giảng</span>
              <span className="lecture-transcript-hint">Chưa có video ghi hình — hiển thị transcript thay thế</span>
            </div>

            {day.transcripts.length > 1 && (
              <div className="lecture-transcript-tabs">
                {day.transcripts.map((t) => (
                  <button
                    key={t.id}
                    className={`lecture-transcript-tab${t.id === activeTranscript?.id ? " active" : ""}`}
                    onClick={() => setTranscriptId(t.id)}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}

            <TranscriptPanel raw={(activeTranscript && transcriptContents[activeTranscript.id]) || ""} />
          </div>
        </div>
      </section>

      {activeCheckpoint && <CheckpointModal checkpoint={activeCheckpoint} onDone={handleCheckpointDone} />}
    </main>
  );
}
