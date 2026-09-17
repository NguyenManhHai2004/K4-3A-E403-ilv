export type AgentKey = "teacher" | "student" | "generator";
export type SenderType = AgentKey | "user";
export type AgentFilter = "all" | AgentKey;

export interface Slide {
  tag: string;
  title: string;
  body: string;
}

export interface Lesson {
  number: number;
  name: string;
  status: string;
  slideCount: number;
}

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
