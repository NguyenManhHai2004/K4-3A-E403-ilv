import { LessonView } from "@/components/lesson/LessonView";
import { fetchLectureDays } from "@/lib/agents-api";
import { findLectureDay } from "@/lib/lecture-data";

export const dynamic = "force-dynamic";

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
  const days = await fetchLectureDays();
  const initialDayId = findLectureDay(days, params.day).id;
  const initialSlide = parseSlide(params.slide);

  return <LessonView days={days} initialDayId={initialDayId} initialSlide={initialSlide} />;
}
