import type { LectureDayId } from "./types";

export interface LectureTranscriptRef {
  id: string;
  title: string;
  content: string;
}

export interface LectureDay {
  id: LectureDayId;
  label: string;
  slidePdfUrl: string;
  slidePdfFallbackPath: string;
  transcripts: LectureTranscriptRef[];
}

export const fallbackLectureDays: LectureDay[] = [
  {
    id: "day1",
    label: "Day 1 — AI & LLM Foundation",
    slidePdfUrl: "https://bleeper.s3.ap-southeast-2.amazonaws.com/d1-slide-hackathon.pdf",
    slidePdfFallbackPath: "/api/slides/day1",
    transcripts: [],
  },
  {
    id: "day2",
    label: "Day 2 — Xác định bài toán cho AI",
    slidePdfUrl: "https://bleeper.s3.ap-southeast-2.amazonaws.com/d2-slide-hackathon.pdf",
    slidePdfFallbackPath: "/api/slides/day2",
    transcripts: [],
  },
];

export const lectureDays = fallbackLectureDays;

export function findLectureDay(days: LectureDay[], dayId: string | null | undefined): LectureDay {
  return days.find((day) => day.id === dayId) ?? days[0] ?? fallbackLectureDays[0];
}
