import { fetchLectureDays } from "@/lib/agents-api";
import { findLectureDay } from "@/lib/lecture-data";
import { MaterialsView } from "@/components/materials/MaterialsView";

export const dynamic = "force-dynamic";

interface MaterialsPageProps {
  searchParams?: Promise<{
    day?: string;
    slide?: string;
    type?: string;
  }>;
}

function parseSlide(raw: string | undefined): number {
  const value = Number.parseInt(raw || "1", 10);
  if (!Number.isFinite(value) || value < 1) return 1;
  return value;
}

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  const params = (await searchParams) || {};
  const days = await fetchLectureDays();
  const initialDayId = findLectureDay(days, params.day).id;
  const initialSlide = parseSlide(params.slide);
  const initialType = params.type || "all";

  return (
    <MaterialsView
      days={days}
      initialDayId={initialDayId}
      initialSlide={initialSlide}
      initialType={initialType}
    />
  );
}
