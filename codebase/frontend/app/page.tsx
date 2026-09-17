import fs from "node:fs";
import path from "node:path";
import { lectureDays } from "@/lib/lecture-data";
import { LessonView } from "@/components/lesson/LessonView";

function readTranscript(fileName: string): string {
  try {
    const filePath = path.join(process.cwd(), "..", "vlearn-pack", "transcript", fileName);
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export default function Home() {
  const transcriptContents: Record<string, string> = {};
  for (const day of lectureDays) {
    for (const t of day.transcripts) {
      transcriptContents[t.id] = readTranscript(t.fileName);
    }
  }

  return <LessonView transcriptContents={transcriptContents} />;
}
