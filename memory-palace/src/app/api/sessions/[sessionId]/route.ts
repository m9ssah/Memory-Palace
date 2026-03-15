import { NextResponse } from "next/server";
import { getSession, endSession, updateSessionEngagement } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const session = await getSession(sessionId);
    return NextResponse.json(session);
  } catch (err) {
    console.error("GET /api/sessions/[id] error:", err);
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    if (body.end) {
      await endSession(sessionId);
    }
    if (body.engagementScore !== undefined) {
      await updateSessionEngagement(sessionId, body.engagementScore, body.notes);
    }

    const session = await getSession(sessionId);
    return NextResponse.json(session);
  } catch (err) {
    console.error("PATCH /api/sessions/[id] error:", err);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
