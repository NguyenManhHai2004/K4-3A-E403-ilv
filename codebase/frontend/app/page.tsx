import fs from "node:fs";
import path from "node:path";
import { findLectureDay, lectureDays } from "@/lib/lecture-data";
import { LessonView } from "@/components/lesson/LessonView";
import type { LectureDayId } from "@/lib/types";

function readTranscript(fileName: string): string {
  try {
    const filePath = path.join(process.cwd(), "..", "vlearn-pack", "transcript", fileName);
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

interface HomeProps {
  searchParams?: Promise<{
    day?: string;
    slide?: string;
  }>;
}

function parseSlide(raw: string | undefined): number {
  const value = Number.parseInt(raw || "1", 10);
  if (!Number.isFinite(value) || value < 1) return 1;
  return value;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = (await searchParams) || {};
  const initialDayId = findLectureDay(params.day).id as LectureDayId;
  const initialSlide = parseSlide(params.slide);
  const transcriptContents: Record<string, string> = {};
  for (const day of lectureDays) {
    for (const t of day.transcripts) {
      transcriptContents[t.id] = readTranscript(t.fileName);
    }
  }

  return (
    <LessonView
      transcriptContents={transcriptContents}
      initialDayId={initialDayId}
      initialSlide={initialSlide}
    />
  );
}
