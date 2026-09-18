import { fallbackLectureDays, type LectureDay, type LectureTranscriptRef } from "./lecture-data";
import type { ConversationHistorySummary, GeneratedMaterialRecord, LectureDayId } from "./types";

interface ArtifactTranscriptPayload {
  id?: string;
  title?: string;
  content?: string;
}

interface ArtifactMetadataPayload {
  transcripts?: ArtifactTranscriptPayload[];
}

interface IngestedArtifactPayload {
  content?: string;
}

interface ArtifactLessonPayload {
  id?: string;
  name?: string;
  url?: string;
  file_path?: string;
  metadata?: ArtifactMetadataPayload;
  ingested_artifact?: IngestedArtifactPayload | null;
}

interface ArtifactListResponse {
  artifacts?: ArtifactLessonPayload[];
}

interface ConversationListResponse {
  conversations?: ConversationHistorySummary[];
}

function getServerApiBaseUrl(): string {
  return process.env.AGENTS_API_BASE_URL ?? process.env.NEXT_PUBLIC_AGENTS_API_BASE_URL ?? "http://127.0.0.1:8000";
}

function getBrowserApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_AGENTS_API_BASE_URL ?? "http://localhost:8000";
}

function buildAbsoluteUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function normalizeTranscripts(payload: ArtifactLessonPayload, fallback: LectureDay): LectureTranscriptRef[] {
  const ingestedContent = payload.ingested_artifact?.content?.trim() || "";
  const transcripts = Array.isArray(payload.metadata?.transcripts) ? payload.metadata.transcripts : [];

  const mapped = transcripts
    .map((transcript, index) => {
      const id = transcript.id?.trim() || `${fallback.id}-transcript-${index + 1}`;
      const title = transcript.title?.trim() || `Transcript ${index + 1}`;
      const content = transcript.content?.trim() || ingestedContent;
      if (!content) return null;
      return { id, title, content };
    })
    .filter((value): value is LectureTranscriptRef => Boolean(value));

  if (mapped.length > 0) {
    return mapped;
  }

  if (!ingestedContent) {
    return fallback.transcripts;
  }

  return [
    {
      id: `${fallback.id}-slides`,
      title: `${fallback.label} — Transcript từ slide`,
      content: ingestedContent,
    },
  ];
}

function toLectureDay(payload: ArtifactLessonPayload): LectureDay | null {
  const artifactId = payload.id?.trim();
  if (!artifactId) return null;

  const fallback = fallbackLectureDays.find((day) => day.id === artifactId);
  if (!fallback) return null;

  return {
    id: fallback.id,
    label: payload.name?.trim() || fallback.label,
    slidePdfUrl: payload.url?.trim() || fallback.slidePdfUrl,
    slidePdfFallbackPath: buildAbsoluteUrl(
      getBrowserApiBaseUrl(),
      payload.file_path?.trim() || `/api/artifacts/${fallback.id}/file`,
    ),
    transcripts: normalizeTranscripts(payload, fallback),
  };
}

export async function fetchLectureDays(): Promise<LectureDay[]> {
  try {
    const response = await fetch(buildAbsoluteUrl(getServerApiBaseUrl(), "/api/artifacts"), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Agents API returned ${response.status}`);
    }

    const payload = (await response.json()) as ArtifactListResponse;
    const days = (payload.artifacts || [])
      .map(toLectureDay)
      .filter((value): value is LectureDay => Boolean(value));

    return days.length > 0 ? days : fallbackLectureDays;
  } catch (error) {
    console.error("Unable to load lecture days from agents backend", error);
    return fallbackLectureDays;
  }
}

export async function fetchConversationHistory(artifactId: LectureDayId): Promise<ConversationHistorySummary[]> {
  try {
    const response = await fetch(
      buildAbsoluteUrl(getBrowserApiBaseUrl(), `/api/artifacts/${artifactId}/conversations`),
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Agents API returned ${response.status}`);
    }

    const payload = (await response.json()) as ConversationListResponse;
    return Array.isArray(payload.conversations) ? payload.conversations : [];
  } catch (error) {
    console.error("Unable to load conversation history from agents backend", error);
    return [];
  }
}

interface MaterialsListResponse {
  materials?: GeneratedMaterialRecord[];
}

export async function fetchGeneratedMaterials(
  artifactId: LectureDayId,
  materialType?: string,
): Promise<GeneratedMaterialRecord[]> {
  try {
    const isServer = typeof window === "undefined";
    const baseUrl = isServer ? getServerApiBaseUrl() : getBrowserApiBaseUrl();
    const url = new URL(buildAbsoluteUrl(baseUrl, `/api/artifacts/${artifactId}/materials`));
    if (materialType && materialType !== "all") {
      url.searchParams.set("type", materialType);
    }
    const response = await fetch(url.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Agents API returned ${response.status}`);
    }

    const payload = (await response.json()) as MaterialsListResponse;
    return Array.isArray(payload.materials) ? payload.materials : [];
  } catch (error) {
    console.error("Unable to load generated materials from agents backend", error);
    return [];
  }
}
