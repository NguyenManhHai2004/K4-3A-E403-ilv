export type AgentKey = "teacher" | "student" | "generator";
export type SenderType = AgentKey | "user";
export type AgentFilter = "all" | AgentKey;
export type LectureDayId = "day1" | "day2";
export type ConversationScope = "shared" | "private_ta" | "private_student" | "material";

export interface Message {
  id: number | string;
  senderType: SenderType;
  senderName: string;
  role: string;
  avatar: string;
  time: string;
  text: string;
  citation?: string;
  activeRecallPrompt?: boolean;
  hasArtifactNotice?: boolean;
  replyTo?: {
    id: number | string;
    text: string;
    senderName: string;
  };
}

export interface PendingPrompt {
  mode: "shared" | "student";
  question: string;
}

export interface ClassroomAgentEvent {
  id?: string | number;
  kind: "message";
  agent: AgentKey;
  channel: "shared" | "private_ta" | "private_student" | "material";
  intent: string;
  reply: string;
  citations: string[];
  active_recall?: boolean;
  reply_to_id?: string | number;
}

export interface QuizArtifactItem {
  question: string;
  options: string[];
  correct_option: string;
  explanation: string;
  citations: string[];
}

export interface QuizArtifactContent {
  type: "quiz";
  title: string;
  language: string;
  covered_until: string;
  instructions: string;
  items: QuizArtifactItem[];
}

export interface FlashcardArtifactItem {
  front: string;
  back: string;
  citations: string[];
}

export interface FlashcardArtifactContent {
  type: "flashcard";
  title: string;
  language: string;
  covered_until: string;
  instructions: string;
  items: FlashcardArtifactItem[];
}

export interface MindmapBranch {
  label: string;
  citations: string[];
  children: MindmapBranch[];
}

export interface MindmapArtifactContent {
  type: "mindmap";
  title: string;
  language: string;
  covered_until: string;
  instructions: string;
  root_topic: string;
  citations: string[];
  branches: MindmapBranch[];
}

export interface GeneratedArtifactBase {
  material_type: "quiz" | "flashcard" | "mindmap";
  title: string;
  covered_until: string;
  content_format: "json" | "xml";
  item_count: number;
  citations: string[];
}

export interface QuizArtifact extends GeneratedArtifactBase {
  material_type: "quiz";
  content: QuizArtifactContent;
}

export interface FlashcardArtifact extends GeneratedArtifactBase {
  material_type: "flashcard";
  content: FlashcardArtifactContent;
}

export interface MindmapArtifact extends GeneratedArtifactBase {
  material_type: "mindmap";
  content: MindmapArtifactContent;
}

export type GeneratedArtifact = QuizArtifact | FlashcardArtifact | MindmapArtifact;

export type GeneratedMaterialType = "quiz" | "flashcard" | "mindmap";

export interface GeneratedMaterialRecord {
  id: string;
  artifact_id: string;
  session_id?: string;
  material_type: GeneratedMaterialType;
  title: string;
  content_format: "json" | "xml";
  content: QuizArtifactContent | FlashcardArtifactContent | MindmapArtifactContent | Record<string, unknown>;
  item_count: number;
  citations: string[];
  covered_until?: string;
  slide_number?: number;
  slide_title?: string;
  created_at: string;
  updated_at: string;
}

export interface ArtifactStore {
  quiz: QuizArtifact | null;
  flashcard: FlashcardArtifact | null;
  mindmap: MindmapArtifact | null;
}

export interface ClassroomSessionSnapshot {
  sessionId: string;
  dayId: LectureDayId;
  currentSlide: number;
  currentSlideTitle: string;
  maxSlide: number;
  pendingPrompt: PendingPrompt | null;
  artifacts: ArtifactStore;
  historyTopics: string[];
  events: ClassroomAgentEvent[];
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

export interface Checkpoint {
  id: number;
  pageIndex: number;
  question: string;
  options: QuizOption[];
}

export interface AgentProfile {
  key: AgentKey;
  name: string;
  tagline: string;
  bio: string;
  quote: string;
}

export interface ChatHistorySession {
  date: string;
  agent: AgentKey;
  topic: string;
}

export interface ConversationHistorySummary {
  id: string;
  artifact_id: LectureDayId;
  scope: ConversationScope;
  topic: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}
