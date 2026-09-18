import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      message: "Classroom HTTP bridge đã bị thay bằng WebSocket transport từ agents backend.",
    },
    { status: 410 },
  );
}
