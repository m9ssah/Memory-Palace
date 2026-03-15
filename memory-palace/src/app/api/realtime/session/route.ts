import { NextRequest, NextResponse } from "next/server";
import { getMemoryAnnotationBySessionId } from "@/lib/db";

/**
 * Creates an ephemeral token for the OpenAI Realtime API.
 * The browser uses this short-lived token to connect directly via WebRTC.
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { sessionId, memoryTitle } = body;

    // Build memory context from annotation
    let memoryContext = "";
    let resolvedTitle = memoryTitle || "a memory";
    if (sessionId) {
      const memoryInfo = await getMemoryAnnotationBySessionId(sessionId);
      if (memoryInfo) {
        resolvedTitle = memoryInfo.title;
        memoryContext = memoryInfo.annotation
          ? `\nHere is what you know about this memory: ${memoryInfo.annotation}`
          : "";
      }
    }

    const instructions =
      `You are a kind, patient memory companion for a person with dementia. ` +
      `Right now, the patient is viewing a 3D recreation of their memory called "${resolvedTitle}" in their Memory Palace. ` +
      `${memoryContext}\n\n` +
      `IMPORTANT: This conversation is specifically about the memory "${resolvedTitle}" that the patient is currently looking at. ` +
      `Always reference this specific memory in your responses. Do NOT ask the patient which memory they want to discuss — ` +
      `you already know they are viewing "${resolvedTitle}". Start by referencing it directly and ask them what they remember or feel about it.\n\n` +
      `Guidelines:\n` +
      `- Keep responses brief (2-3 sentences)\n` +
      `- Be warm, encouraging, and ask gentle questions about THIS specific memory\n` +
      `- Never correct or contradict their memories — validate their experiences\n` +
      `- Help them explore feelings and details connected to "${resolvedTitle}"\n` +
      `- Speak naturally and conversationally, like a caring friend sitting beside them`;

    const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice: "shimmer",
        instructions,
        input_audio_transcription: { model: "gpt-4o-mini-transcribe" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 700,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI Realtime session error:", errText);
      return NextResponse.json(
        { error: "Failed to create realtime session" },
        { status: res.status },
      );
    }

    const data = await res.json();

    return NextResponse.json({
      clientSecret: data.client_secret?.value,
      expiresAt: data.client_secret?.expires_at,
      sessionId: data.id,
    });
  } catch (error) {
    console.error("Error creating realtime session:", error);
    return NextResponse.json(
      { error: "Failed to create realtime session" },
      { status: 500 },
    );
  }
}
