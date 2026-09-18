import { ClassroomView } from "@/components/classroom/ClassroomView";
import { fetchLectureDays } from "@/lib/agents-api";
import { findLectureDay } from "@/lib/lecture-data";

export const dynamic = "force-dynamic";

interface ClassroomPageProps {
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

export default async function ClassroomPage({ searchParams }: ClassroomPageProps) {
  const params = (await searchParams) || {};
  const days = await fetchLectureDays();
  const initialDayId = findLectureDay(days, params.day).id;
  const initialSlide = parseSlide(params.slide);

  return <ClassroomView days={days} initialDayId={initialDayId} initialSlide={initialSlide} />;
}
