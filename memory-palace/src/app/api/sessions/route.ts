import { NextResponse } from "next/server";
import { createSession, createMemory, getAllSessions, supabase } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const { memoryId, worldId } = await request.json();
    if (!memoryId) {
      return NextResponse.json({ error: "memoryId is required" }, { status: 400 });
    }

    // Ensure the memory exists (handles demo/placeholder memories)
    const { data: existing } = await supabase
      .from("memories")
      .select("id")
      .eq("id", memoryId)
      .single();
    if (!existing) {
      await createMemory(memoryId, "Lobby Session");
    }

    const id = uuidv4();
    await createSession(id, memoryId, worldId);
    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/sessions error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sessions = await getAllSessions();
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("GET /api/sessions error:", err);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}
