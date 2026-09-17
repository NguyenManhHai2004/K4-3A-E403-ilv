import { ClassroomView } from "@/components/classroom/ClassroomView";
import { findLectureDay } from "@/lib/lecture-data";
import type { LectureDayId } from "@/lib/types";

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
  const initialDayId = findLectureDay(params.day).id as LectureDayId;
  const initialSlide = parseSlide(params.slide);

  return <ClassroomView initialDayId={initialDayId} initialSlide={initialSlide} />;
}
