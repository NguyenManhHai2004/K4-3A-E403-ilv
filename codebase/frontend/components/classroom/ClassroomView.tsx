"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClassroomChat } from "@/hooks/useClassroomChat";
import { useToast } from "@/components/ui/ToastProvider";
import { findLectureDay, type LectureDay } from "@/lib/lecture-data";
import { AgentSidebar } from "./AgentSidebar";
import { ArtifactsSidebar } from "./ArtifactsSidebar";
import { ChatComposer } from "./ChatComposer";
import { ChatHistoryDrawer } from "./ChatHistoryDrawer";
import { ChatStream } from "./ChatStream";
import { LearningViewer } from "./LearningViewer";
import { AgentProfileModal } from "./AgentProfileModal";
import type { AgentFilter, AgentKey, ArtifactFilter, LectureDayId } from "@/lib/types";

const modeTabs: { key: AgentFilter; label: string }[] = [
  { key: "all", label: "Thảo luận chung" },
  { key: "teacher", label: "👨‍🏫 Giảng viên" },
  { key: "student", label: "🎒 Bạn học" },
  { key: "generator", label: "⚡ Material Bot" },
];

function parseInitialSlide(raw: number | string | null): number {
  const value = Number.parseInt(String(raw || "1"), 10);
  if (!Number.isFinite(value) || value < 1) return 1;
  return value;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  const tagName = element?.tagName?.toLowerCase();
  return Boolean(element?.isContentEditable) || tagName === "input" || tagName === "textarea" || tagName === "select";
}

interface ClassroomViewProps {
  days: LectureDay[];
  initialDayId: LectureDayId;
  initialSlide: number;
}

export function ClassroomView({ days, initialDayId, initialSlide }: ClassroomViewProps) {
  const router = useRouter();
  const initialDay = findLectureDay(days, initialDayId);
  const resolvedInitialSlide = parseInitialSlide(initialSlide);

  const [sessionSeed, setSessionSeed] = useState<{ dayId: LectureDayId; slide: number }>({
    dayId: initialDay.id,
    slide: resolvedInitialSlide,
  });
  const [dayId, setDayId] = useState<LectureDayId>(initialDay.id);
  const [pageIndex, setPageIndex] = useState(resolvedInitialSlide - 1);
  const [pageCount, setPageCount] = useState(1);
  const [artifactFilter, setArtifactFilter] = useState<ArtifactFilter>("all");
  const [agentsExpanded, setAgentsExpanded] = useState(true);
  const [artifactsExpanded, setArtifactsExpanded] = useState(true);
  const [openProfile, setOpenProfile] = useState<AgentKey | null>(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const keyboardSlideChangeRef = useRef<(delta: number) => void>(() => {});
  const { showToast } = useToast();

  const {
    messages,
    agentFilter,
    typingLabel,
    artifacts,
    historyTopics,
    pendingPrompt,
    sessionMeta,
    errorMessage,
    isBusy,
    bootstrapSession,
    syncSlide,
    sendMessage,
    changeAgentFilter,
    resetConversation,
  } = useClassroomChat(() => {
    setArtifactsExpanded(true);
    setArtifactFilter("all");
    showToast("⚡ Artifacts mới đã được tạo từ slide thật!");
  });

  const day = findLectureDay(days, dayId);
  const availableArtifactKeys: ArtifactFilter[] = [];
  if (artifacts.quiz) availableArtifactKeys.push("quiz");
  if (artifacts.flashcard) availableArtifactKeys.push("cards");
  if (artifacts.mindmap) availableArtifactKeys.push("mindmap");

  useEffect(() => {
    void bootstrapSession(sessionSeed.dayId, sessionSeed.slide, "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionSeed.dayId, sessionSeed.slide]);

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(Math.max(pageCount - 1, 0));
    }
  }, [pageCount, pageIndex]);

  useEffect(() => {
    router.replace(`/classroom?day=${dayId}&slide=${pageIndex + 1}`, { scroll: false });
  }, [dayId, pageIndex, router]);

  function handleSelectDay(nextDayId: LectureDayId) {
    const nextDay = days.find((candidate) => candidate.id === nextDayId);
    if (!nextDay) return;
    setDayId(nextDayId);
    setPageIndex(0);
    setPageCount(1);
    setArtifactFilter("all");
    setSessionSeed({ dayId: nextDay.id, slide: 1 });
  }

  async function handleModeChange(nextFilter: AgentFilter) {
    if (nextFilter === agentFilter) return;
    await changeAgentFilter(nextFilter, pageIndex + 1);
  }

  async function handleSlideChange(nextPageIndex: number) {
    if (nextPageIndex === pageIndex) return;
    setPageIndex(nextPageIndex);
    await syncSlide(nextPageIndex + 1, agentFilter);
  }

  async function changeSlideByDelta(delta: number) {
    const nextPageIndex = pageIndex + delta;
    if (nextPageIndex < 0 || nextPageIndex >= pageCount) return;
    await handleSlideChange(nextPageIndex);
  }
  keyboardSlideChangeRef.current = (delta: number) => {
    void changeSlideByDelta(delta);
  };

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowLeft" && pageIndex > 0) {
        event.preventDefault();
        keyboardSlideChangeRef.current(-1);
      }
      if (event.key === "ArrowRight" && pageIndex < pageCount - 1) {
        event.preventDefault();
        keyboardSlideChangeRef.current(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageCount, pageIndex]);

  async function handleReset() {
    await resetConversation(dayId, pageIndex + 1);
    setArtifactFilter("all");
    showToast("Đã khởi tạo lại classroom cho slide hiện tại.");
  }

  return (
    <main className="view-container classroom-view active-view">
      <div className="classroom-top-bar">
        <Link href={`/?day=${dayId}&slide=${pageIndex + 1}`} className="back-to-lesson-btn">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Quay lại bài giảng
        </Link>

        <div className="classroom-status-group">
          <div className="classroom-mode-select">
            {modeTabs.map((tab) => (
              <button
                key={tab.key}
                className={`mode-tab${agentFilter === tab.key ? " active" : ""}`}
                onClick={() => void handleModeChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="back-to-lesson-btn"
          style={{
            color: "var(--generator-color)",
            borderColor: "var(--generator-border)",
          }}
          onClick={() => void handleReset()}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="1 4 1 10 7 10"></polyline>
            <polyline points="23 20 23 14 17 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
          </svg>
          Khởi tạo lại classroom
        </button>
      </div>

      <div className="classroom-grid">
        <aside className="classroom-left-sidebar">
          <div className="sidebar-section-card">
            <button
              className={`sidebar-section-toggle${agentsExpanded ? " open" : ""}`}
              onClick={() => setAgentsExpanded((value) => !value)}
              aria-expanded={agentsExpanded}
            >
              <span className="sidebar-section-toggle-copy">
                <span className="sidebar-section-title">Danh sách AI Agents</span>
                <span className="sidebar-section-subtitle">Chọn nhanh tác tử và xem chủ đề thảo luận gần đây</span>
              </span>
              <span className="sidebar-section-chevron">{agentsExpanded ? "▾" : "▸"}</span>
            </button>
            {agentsExpanded && (
              <AgentSidebar
                agentFilter={agentFilter}
                historyTopics={historyTopics}
                onSelect={(filter) => void handleModeChange(filter)}
                onOpenProfile={(agent) => setOpenProfile(agent)}
                onOpenHistory={() => setHistoryDrawerOpen(true)}
              />
            )}
          </div>

          <div className="sidebar-section-card">
            <button
              className={`sidebar-section-toggle${artifactsExpanded ? " open" : ""}`}
              onClick={() => setArtifactsExpanded((value) => !value)}
              aria-expanded={artifactsExpanded}
            >
              <span className="sidebar-section-toggle-copy">
                <span className="sidebar-section-title">Kho Artifacts đã gen</span>
                <span className="sidebar-section-subtitle">Các tài liệu ôn tập được sinh từ nội dung slide thật</span>
              </span>
              <span className="sidebar-section-toggle-meta">
                <span
                  className="artifact-count-tag"
                  style={availableArtifactKeys.length > 0 ? { background: "var(--student-color)", color: "#fff" } : undefined}
                >
                  {availableArtifactKeys.length}
                </span>
                <span className="sidebar-section-chevron">{artifactsExpanded ? "▾" : "▸"}</span>
              </span>
            </button>
            {artifactsExpanded && (
              <ArtifactsSidebar
                artifacts={artifacts}
                filter={artifactFilter}
                onFilterChange={setArtifactFilter}
                docCount={availableArtifactKeys.length}
                highlighted={availableArtifactKeys.length > 0}
                showTitleRow={false}
              />
            )}
          </div>
        </aside>

        <section className="classroom-stage-panel classroom-stage-main">
          <div className="lecture-day-tabs">
            {days.map((lectureDay) => (
              <button
                key={lectureDay.id}
                className={`lecture-day-tab${lectureDay.id === dayId ? " active" : ""}`}
                onClick={() => handleSelectDay(lectureDay.id)}
              >
                {lectureDay.label}
              </button>
            ))}
          </div>

          <div className="classroom-stage-head">
            <div>
              <div className="lecture-screen-label">📄 Nguồn bài giảng</div>
              <div className="classroom-stage-title">{day.label}</div>
            </div>
            <div className="classroom-stage-meta">
              <span>Slide {pageIndex + 1}</span>
              <span>{sessionMeta.currentSlideTitle || "Đang tải ngữ cảnh slide..."}</span>
              <span>Dùng chuột hoặc phím mũi tên trái/phải để chuyển slide</span>
            </div>
          </div>

          <LearningViewer
            type="slide"
            src={day.slidePdfUrl}
            fallbackSrc={day.slidePdfFallbackPath}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPageCount={setPageCount}
            onPageChange={(nextPageIndex) => void handleSlideChange(nextPageIndex)}
          />
        </section>

        <aside className="col-chat-main classroom-chat-sidebar border-l border-border-subtle bg-bg-surface flex flex-col h-full">
          <div className="classroom-chat-meta">
            <div className="classroom-chat-title">Trao đổi theo slide hiện tại</div>
            <div className="classroom-chat-subtitle">
              {pendingPrompt
                ? "Đang chờ bạn phản hồi cho câu hỏi gần nhất của agent."
                : "Đổi slide hoặc chọn mode để agent chủ động bắt đầu tương tác."}
            </div>
          </div>

          {errorMessage && <div className="classroom-error-banner">{errorMessage}</div>}

          <ChatStream
            messages={messages}
            typingLabel={typingLabel}
            onPreviewArtifacts={() => {
              setArtifactsExpanded(true);
              setArtifactFilter("all");
            }}
          />
          <ChatComposer
            defaultTarget={agentFilter}
            onSend={(text, target) => void sendMessage(text, target, pageIndex + 1)}
          />
          {isBusy && !typingLabel && <div className="classroom-loading-bar" />}
        </aside>
      </div>

      {openProfile && <AgentProfileModal agentKey={openProfile} onClose={() => setOpenProfile(null)} />}
      {historyDrawerOpen && <ChatHistoryDrawer artifactId={dayId} onClose={() => setHistoryDrawerOpen(false)} />}
    </main>
  );
}
