import type { ArtifactFilter, ArtifactStore } from "@/lib/types";
import { QuizPanel } from "@/components/artifacts/QuizPanel";
import { FlashcardPanel } from "@/components/artifacts/FlashcardPanel";
import { MindmapPanel } from "@/components/artifacts/MindmapPanel";

interface ArtifactsSidebarProps {
  artifacts: ArtifactStore;
  filter: ArtifactFilter;
  onFilterChange: (filter: ArtifactFilter) => void;
  docCount: number;
  highlighted: boolean;
  showTitleRow?: boolean;
}

const tabs: { key: ArtifactFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "quiz", label: "Quiz" },
  { key: "cards", label: "Flashcard" },
  { key: "mindmap", label: "Mindmap" },
];

export function ArtifactsSidebar({
  artifacts,
  filter,
  onFilterChange,
  docCount,
  highlighted,
  showTitleRow = true,
}: ArtifactsSidebarProps) {
  const showQuiz = filter === "all" || filter === "quiz";
  const showCards = filter === "all" || filter === "cards";
  const showMindmap = filter === "all" || filter === "mindmap";

  return (
    <div className="col-artifacts-sidebar">
      <div className="artifacts-header">
        {showTitleRow && (
          <div className="artifacts-title-row">
            <div className="artifacts-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--generator-color)" strokeWidth="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span>Kho Artifacts đã gen</span>
            </div>
            <span
              className="artifact-count-tag"
              style={highlighted ? { background: "var(--student-color)", color: "#fff" } : undefined}
            >
              {docCount} tài liệu
            </span>
          </div>
        )}

        <div className="artifact-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`art-tab-btn${filter === tab.key ? " active" : ""}`}
              onClick={() => onFilterChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="artifacts-body">
        {showQuiz && <QuizPanel artifact={artifacts.quiz} />}
        {showCards && <FlashcardPanel artifact={artifacts.flashcard} />}
        {showMindmap && <MindmapPanel artifact={artifacts.mindmap} />}
      </div>
    </div>
  );
}
