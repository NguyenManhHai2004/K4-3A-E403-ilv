"use client";

import { useToast } from "@/components/ui/ToastProvider";
import type { MindmapArtifact, MindmapBranch } from "@/lib/types";

interface MindmapPanelProps {
  artifact: MindmapArtifact | null;
}

function BranchTree({ branch, onSelect }: { branch: MindmapBranch; onSelect: (label: string) => void }) {
  return (
    <div className="mm-branch">
      <div className="mm-node-leaf" onClick={() => onSelect(branch.label)}>
        <span>{branch.label}</span>
        <span className="mm-leaf-tag">{branch.citations[0] ?? "slide"}</span>
      </div>
      {branch.children.map((child) => (
        <BranchTree key={`${branch.label}-${child.label}`} branch={child} onSelect={onSelect} />
      ))}
    </div>
  );
}

export function MindmapPanel({ artifact }: MindmapPanelProps) {
  const { showToast } = useToast();

  if (!artifact) {
    return (
      <div className="artifact-panel">
        <div className="panel-header">
          <span className="panel-badge mindmap-badge">Mindmap Kiến thức Tương tác</span>
        </div>
        <div className="transcript-empty">
          Chưa có mindmap nào. Hãy yêu cầu Material Bot tạo `mindmap` để hệ thống dựng sơ đồ từ nội dung slide.
        </div>
      </div>
    );
  }

  return (
    <div className="artifact-panel">
      <div className="panel-header">
        <span className="panel-badge mindmap-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Mindmap Kiến thức Tương tác
        </span>
      </div>

      <div className="mindmap-tree">
        <div className="mm-node-root">
          <span>🧠 {artifact.content.root_topic}</span>
        </div>
        {artifact.content.branches.map((branch) => (
          <BranchTree
            key={branch.label}
            branch={branch}
            onSelect={(label) => showToast(`Mindmap: ${label}`)}
          />
        ))}
      </div>
    </div>
  );
}
