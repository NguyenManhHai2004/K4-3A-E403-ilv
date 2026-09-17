/**
 * Metadata only (không chứa nội dung thật) — an toàn để commit.
 * File PDF/transcript thật nằm ở vlearn-pack/ (đã gitignore, chỉ có trên máy local).
 */

export interface LectureTranscriptRef {
  id: string;
  fileName: string;
  title: string;
}

export interface LectureDay {
  id: "day1" | "day2";
  label: string;
  slidePdfPath: string;
  transcripts: LectureTranscriptRef[];
}

export const lectureDays: LectureDay[] = [
  {
    id: "day1",
    label: "Day 1 — AI & LLM Foundation",
    slidePdfPath: "/vlearn-pack/slides/d1-slide-hackathon.pdf",
    transcripts: [
      { id: "t04", fileName: "transcript-04-clean.md", title: "Foundation: cách LLM hoạt động" },
      { id: "t06", fileName: "transcript-06-clean.md", title: "Foundation: transformer & attention" },
    ],
  },
  {
    id: "day2",
    label: "Day 2 — Xác định bài toán cho AI",
    slidePdfPath: "/vlearn-pack/slides/d2-slide-hackathon.pdf",
    transcripts: [
      { id: "t01", fileName: "transcript-01-clean.md", title: "Sáng — Xác định bài toán kinh doanh" },
      { id: "t02", fileName: "transcript-02-clean.md", title: "Chỉ số thành công & mức tự động hoá" },
      { id: "t03", fileName: "transcript-03-clean.md", title: "Chiều — Soi bài toán các nhóm" },
      { id: "t05", fileName: "transcript-05-clean.md", title: "Bài toán · đánh giá · dữ liệu" },
    ],
  },
];
