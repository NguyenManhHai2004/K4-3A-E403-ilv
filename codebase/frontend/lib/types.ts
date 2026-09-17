export type AgentKey = "teacher" | "student" | "generator";
export type SenderType = AgentKey | "user";
export type AgentFilter = "all" | AgentKey;

export interface Message {
  id: number;
  senderType: SenderType;
  senderName: string;
  role: string;
  avatar: string;
  time: string;
  text: string;
  activeRecallPrompt?: boolean;
  hasArtifactNotice?: boolean;
}

export interface Flashcard {
  term: string;
  def: string;
}

export interface QuizOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  options: QuizOption[];
  correctFeedback: string;
  wrongFeedback: string;
}

export type ArtifactFilter = "all" | "quiz" | "cards" | "mindmap";

export interface MindmapLeaf {
  label: string;
  tag: string;
  detail: string;
}

/* ---------------------------------------------------------------------- */
/* Checkpoint: quiz gắn tại 1 trang slide PDF cụ thể                     */
/* ---------------------------------------------------------------------- */

export interface Checkpoint {
  id: number;
  pageIndex: number;
  question: string;
  options: QuizOption[];
}

/* ---------------------------------------------------------------------- */
/* Agent profile popup                                                    */
/* ---------------------------------------------------------------------- */

export interface AgentProfile {
  key: AgentKey;
  name: string;
  tagline: string;
  bio: string;
  quote: string;
}

/* ---------------------------------------------------------------------- */
/* Agent chat history drawer                                              */
/* ---------------------------------------------------------------------- */

export interface ChatHistorySession {
  date: string;
  agent: AgentKey;
  topic: string;
}
