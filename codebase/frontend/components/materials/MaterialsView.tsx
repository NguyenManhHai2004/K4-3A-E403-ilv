"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LectureDay } from "@/lib/lecture-data";
import type {
  GeneratedMaterialRecord,
  LectureDayId,
  QuizArtifact,
  FlashcardArtifact,
  MindmapArtifact,
} from "@/lib/types";
import { fetchGeneratedMaterials } from "@/lib/agents-api";
import { QuizPanel } from "@/components/artifacts/QuizPanel";
import { FlashcardPanel } from "@/components/artifacts/FlashcardPanel";
import { MindmapPanel } from "@/components/artifacts/MindmapPanel";

interface MaterialsViewProps {
  days: LectureDay[];
  initialDayId: LectureDayId;
  initialSlide?: number;
  initialType?: string;
}

type MaterialFilter = "all" | "quiz" | "flashcard" | "mindmap";

function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "";
  }
}

function typeBadge(type: string): { label: string; icon: string; className: string } {
  switch (type) {
    case "quiz":
      return { label: "Quiz Trắc nghiệm", icon: "📝", className: "quiz-badge" };
    case "flashcard":
    case "cards":
      return { label: "Flashcards 3D", icon: "🃏", className: "flashcard-badge" };
    case "mindmap":
      return { label: "Mindmap Tư duy", icon: "🧠", className: "mindmap-badge" };
    default:
      return { label: "Học liệu", icon: "⚡", className: "quiz-badge" };
  }
}

export function MaterialsView({
  days,
  initialDayId,
  initialSlide = 1,
  initialType = "all",
}: MaterialsViewProps) {
  const [dayId, setDayId] = useState<LectureDayId>(initialDayId);
  const [filter, setFilter] = useState<MaterialFilter>(
    initialType === "quiz" || initialType === "flashcard" || initialType === "mindmap"
      ? initialType
      : "all",
  );
  const [materials, setMaterials] = useState<GeneratedMaterialRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentDay = days.find((d) => d.id === dayId) || days[0];

  useEffect(() => {
    let cancelled = false;
    async function loadMaterials() {
      setIsLoading(true);
      try {
        const items = await fetchGeneratedMaterials(dayId);
        if (!cancelled) {
          setMaterials(items);
          if (items.length > 0) {
            setSelectedId((prev) => {
              if (prev && items.some((item) => item.id === prev)) return prev;
              return items[0].id;
            });
          } else {
            setSelectedId(null);
          }
        }
      } catch (err) {
        console.error("Failed to load materials", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadMaterials();
    return () => {
      cancelled = true;
    };
  }, [dayId]);

  const filteredMaterials = useMemo(() => {
    if (filter === "all") return materials;
    return materials.filter((m) => m.material_type === filter);
  }, [materials, filter]);

  const selectedMaterial = useMemo(() => {
    if (!selectedId) return filteredMaterials[0] || null;
    return materials.find((m) => m.id === selectedId) || filteredMaterials[0] || null;
  }, [selectedId, materials, filteredMaterials]);

  const counts = useMemo(() => {
    return {
      all: materials.length,
      quiz: materials.filter((m) => m.material_type === "quiz").length,
      flashcard: materials.filter((m) => m.material_type === "flashcard").length,
      mindmap: materials.filter((m) => m.material_type === "mindmap").length,
    };
  }, [materials]);

  return (
    <main className="view-container materials-view active-view flex flex-col h-screen overflow-hidden bg-bg-main">
      {/* Top Navigation Bar */}
      <div className="classroom-top-bar flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-surface">
        <div className="flex items-center gap-3">
          <Link
            href={`/classroom?day=${dayId}&slide=${initialSlide}`}
            className="back-to-lesson-btn"
          >
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
            Quay lại phòng học
          </Link>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="text-amber-500">⚡</span>
              Kho học liệu ôn tập đã tạo
            </h1>
            <span className="text-xs text-text-secondary">{currentDay.label}</span>
          </div>
        </div>

        {/* Day selection tabs */}
        <div className="flex items-center gap-2">
          <div className="classroom-mode-select">
            {days.map((d) => (
              <button
                key={d.id}
                className={`mode-tab${dayId === d.id ? " active" : ""}`}
                onClick={() => setDayId(d.id)}
              >
                {d.label.split("—")[0].trim()}
              </button>
            ))}
          </div>

          <Link
            href={`/?day=${dayId}&slide=${initialSlide}`}
            className="back-to-lesson-btn"
            style={{ color: "var(--text-secondary)" }}
          >
            Bài giảng gốc
          </Link>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: List of generated materials */}
        <aside className="w-80 md:w-96 border-r border-border-subtle bg-bg-surface flex flex-col h-full flex-shrink-0">
          {/* Filter Bar */}
          <div className="p-3 border-b border-border-subtle bg-bg-surface-elevated/50">
            <div className="artifact-tabs flex gap-1 w-full">
              <button
                className={`art-tab-btn flex-1 text-xs py-1.5${filter === "all" ? " active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Tất cả ({counts.all})
              </button>
              <button
                className={`art-tab-btn flex-1 text-xs py-1.5${filter === "quiz" ? " active" : ""}`}
                onClick={() => setFilter("quiz")}
              >
                Quiz ({counts.quiz})
              </button>
              <button
                className={`art-tab-btn flex-1 text-xs py-1.5${filter === "flashcard" ? " active" : ""}`}
                onClick={() => setFilter("flashcard")}
              >
                Thẻ ({counts.flashcard})
              </button>
              <button
                className={`art-tab-btn flex-1 text-xs py-1.5${filter === "mindmap" ? " active" : ""}`}
                onClick={() => setFilter("mindmap")}
              >
                Sơ đồ ({counts.mindmap})
              </button>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoading && (
              <div className="p-6 text-center text-sm text-text-secondary">
                Đang tải danh sách học liệu từ database...
              </div>
            )}

            {!isLoading && filteredMaterials.length === 0 && (
              <div className="p-6 text-center space-y-3">
                <div className="text-3xl">📭</div>
                <div className="text-sm font-semibold text-text-primary">
                  {filter === "all"
                    ? "Chưa có học liệu nào được tạo"
                    : `Chưa có học liệu loại ${filter}`}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Hãy vào phòng học và chat với Nexus Bot (ví dụ: &ldquo;tạo quiz&rdquo;, &ldquo;tạo flashcard&rdquo;, &ldquo;tạo mindmap&rdquo;) để tự động sinh học liệu bám sát slide thật!
                </p>
                <Link
                  href={`/classroom?day=${dayId}&slide=${initialSlide}`}
                  className="inline-block mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Vào phòng học ngay
                </Link>
              </div>
            )}

            {!isLoading &&
              filteredMaterials.map((mat) => {
                const badge = typeBadge(mat.material_type);
                const isSelected = selectedMaterial?.id === mat.id;
                return (
                  <div
                    key={mat.id}
                    onClick={() => setSelectedId(mat.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 shadow-sm"
                        : "border-border-subtle bg-bg-surface hover:border-border-focus hover:bg-bg-surface-elevated"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                        {badge.icon} {badge.label}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {mat.item_count ? `${mat.item_count} mục` : ""}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                      {mat.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] text-text-secondary mt-2 pt-2 border-t border-border-subtle/50">
                      <span>{mat.covered_until || (mat.slide_number ? `Slide ${mat.slide_number}` : "Bài giảng")}</span>
                      <span>{formatTimestamp(mat.created_at)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </aside>

        {/* Right column: Interactive viewer of the selected material */}
        <section className="flex-1 flex flex-col h-full overflow-hidden bg-bg-surface-elevated/30">
          {selectedMaterial ? (
            <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                    <span>Nguồn: {currentDay.label}</span>
                    <span>•</span>
                    <span>{selectedMaterial.covered_until || `Slide ${selectedMaterial.slide_number || 1}`}</span>
                    <span>•</span>
                    <span>Tạo lúc: {formatTimestamp(selectedMaterial.created_at)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {selectedMaterial.title}
                  </h2>
                </div>
              </div>

              {/* Render Artifact Panel */}
              <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm p-4">
                {selectedMaterial.material_type === "quiz" && (
                  <QuizPanel artifact={selectedMaterial as unknown as QuizArtifact} />
                )}
                {selectedMaterial.material_type === "flashcard" && (
                  <FlashcardPanel artifact={selectedMaterial as unknown as FlashcardArtifact} />
                )}
                {selectedMaterial.material_type === "mindmap" && (
                  <MindmapPanel artifact={selectedMaterial as unknown as MindmapArtifact} />
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-text-secondary">
              <div>
                <div className="text-4xl mb-2">⚡</div>
                <p className="text-sm font-medium">Chọn một học liệu ở danh sách bên trái để xem nội dung tương tác.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
