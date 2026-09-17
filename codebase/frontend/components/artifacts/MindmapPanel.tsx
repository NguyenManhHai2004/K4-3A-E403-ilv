"use client";

import { mindmapLeaves } from "@/lib/mock-data";
import { useToast } from "@/components/ui/ToastProvider";

export function MindmapPanel() {
  const { showToast } = useToast();

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
          <span>🧠 Transformer Attention Architecture</span>
        </div>
        <div className="mm-branch">
          {mindmapLeaves.map((leaf) => (
            <div key={leaf.label} className="mm-node-leaf" onClick={() => showToast(leaf.detail)}>
              <span>{leaf.label}</span>
              <span className="mm-leaf-tag">{leaf.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
