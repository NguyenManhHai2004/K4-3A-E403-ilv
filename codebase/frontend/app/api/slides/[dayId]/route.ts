import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SLIDE_FILES: Record<string, string> = {
  day1: "d1-slide-hackathon.pdf",
  day2: "d2-slide-hackathon.pdf",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ dayId: string }> },
) {
  const { dayId } = await context.params;
  const fileName = SLIDE_FILES[dayId];
  if (!fileName) {
    return NextResponse.json({ message: "Unknown slide deck." }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "..", "agents", "data", "slides", fileName);

  try {
    const pdf = await fs.readFile(filePath);
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ message: "Slide file is unavailable." }, { status: 404 });
  }
}
