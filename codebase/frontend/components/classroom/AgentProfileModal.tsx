import { agentProfiles } from "@/lib/mock-data";
import type { AgentKey } from "@/lib/types";

interface AgentProfileModalProps {
  agentKey: AgentKey;
  onClose: () => void;
}

const avatarEmoji: Record<AgentKey, string> = {
  teacher: "👨‍🏫",
  student: "🎒",
  generator: "⚡",
};

const avatarClass: Record<AgentKey, string> = {
  teacher: "avatar-teacher",
  student: "avatar-student",
  generator: "avatar-generator",
};

const roleLabel: Record<AgentKey, string> = {
  teacher: "Giảng viên",
  student: "Bạn học",
  generator: "Sinh tài liệu",
};

export function AgentProfileModal({ agentKey, onClose }: AgentProfileModalProps) {
  const profile = agentProfiles[agentKey];

  return (
    <div className="agent-profile-backdrop" onClick={onClose}>
      <div className="agent-profile-card" onClick={(e) => e.stopPropagation()}>
        <button className="agent-profile-close" onClick={onClose}>
          ✕
        </button>

        <div className="agent-profile-head">
          <div className={`agent-profile-avatar ${avatarClass[agentKey]}`}>{avatarEmoji[agentKey]}</div>
          <div>
            <div className="agent-name" style={{ fontSize: 16 }}>
              {profile.name}
            </div>
            <div className="agent-profile-role">{roleLabel[agentKey]}</div>
          </div>
        </div>

        <div className="agent-profile-tagline">{profile.tagline}</div>
        <div className="agent-profile-body">{profile.bio}</div>
        <div className="agent-profile-quote">“{profile.quote}”</div>
      </div>
    </div>
  );
}
