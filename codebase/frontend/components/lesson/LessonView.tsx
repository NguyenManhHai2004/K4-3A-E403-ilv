"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { checkpointsByDay } from "@/lib/mock-data";
import { findLectureDay, type LectureDay } from "@/lib/lecture-data";
import { LessonSidebar } from "./LessonSidebar";
import { PdfSlideStage } from "./PdfSlideStage";
import { SlideFooterNav } from "./SlideFooterNav";
import { CheckpointModal } from "./CheckpointModal";
import { TranscriptPanel } from "@/components/lecture/TranscriptPanel";
import { useToast } from "@/components/ui/ToastProvider";
import type { LectureDayId } from "@/lib/types";

interface LessonViewProps {
  days: LectureDay[];
  initialDayId?: LectureDayId;
  initialSlide?: number;
}

export function LessonView({ days, initialDayId, initialSlide = 1 }: LessonViewProps) {
  const resolvedDayId = findLectureDay(days, initialDayId).id;
  const resolvedSlide = Math.max(1, initialSlide);
  const [dayId, setDayId] = useState<LectureDay["id"]>(resolvedDayId);
  const [pageIndex, setPageIndex] = useState(resolvedSlide - 1);
  const [pageCount, setPageCount] = useState(1);
  const [answeredCheckpointIds, setAnsweredCheckpointIds] = useState<Set<number>>(new Set());
  const [activeCheckpointId, setActiveCheckpointId] = useState<number | null>(null);
  const { showToast } = useToast();

  const day = findLectureDay(days, dayId);
  const [transcriptId, setTranscriptId] = useState(day.transcripts[0]?.id);
  const activeTranscript = day.transcripts.find((t) => t.id === transcriptId) ?? day.transcripts[0];

  const checkpoints = checkpointsByDay[dayId] ?? [];
  const activeCheckpoint = checkpoints.find((c) => c.id === activeCheckpointId) ?? null;
  const keyboardPageChangeRef = useRef<(delta: number) => void>(() => {});

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  function handleSelectDay(id: LectureDay["id"]) {
    const nextDay = days.find((d) => d.id === id);
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
  keyboardPageChangeRef.current = changePage;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isEditable =
        Boolean(target?.isContentEditable) ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select";
      if (isEditable) return;

      if (event.key === "ArrowLeft" && pageIndex > 0) {
        event.preventDefault();
        keyboardPageChangeRef.current(-1);
      }
      if (event.key === "ArrowRight" && pageIndex < pageCount - 1) {
        event.preventDefault();
        keyboardPageChangeRef.current(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageCount, pageIndex]);

  function handleCheckpointDone() {
    if (activeCheckpointId !== null) {
      setAnsweredCheckpointIds((prev) => new Set(prev).add(activeCheckpointId));
    }
    setActiveCheckpointId(null);
  }

  return (
    <main className="view-container lesson-view active-view">
      <LessonSidebar days={days} activeDayId={dayId} onSelectDay={handleSelectDay} />

      <section className="lesson-main">
        <div className="lesson-content-header">
          <div>
            <div className="lesson-breadcrumb">
              <span>Khóa học AI</span> / <span>{day.label}</span>
            </div>
            <h1 className="lesson-main-title">{day.label}</h1>
          </div>

          <Link
            href={`/classroom?day=${day.id}&slide=${pageIndex + 1}`}
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
            {days.map((d) => (
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
            <div className="slide-stage-canvas-shell">
              <button
                className="btn-stage-nav prev"
                onClick={() => changePage(-1)}
                disabled={pageIndex === 0}
                aria-label="Slide trước"
              >
                ◀
              </button>
              <PdfSlideStage
                objectUrl={day.slidePdfUrl}
                fallbackUrl={day.slidePdfFallbackPath}
                pageIndex={pageIndex}
                onPageCount={setPageCount}
              />
              <button
                className="btn-stage-nav next"
                onClick={() => changePage(1)}
                disabled={pageIndex === pageCount - 1}
                aria-label="Slide kế tiếp"
              >
                ▶
              </button>
            </div>
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
              <span className="lecture-transcript-hint">Dữ liệu transcript được phục vụ từ artifact đã ingest ở backend agents</span>
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

            <TranscriptPanel raw={activeTranscript?.content || ""} />
          </div>
        </div>
      </section>

      {activeCheckpoint && <CheckpointModal checkpoint={activeCheckpoint} onDone={handleCheckpointDone} />}
    </main>
  );
}
