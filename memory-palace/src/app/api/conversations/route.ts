import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createAIConversation, getAllAIConversations, getMemoryAnnotationBySessionId } from "@/lib/db";
import { ConversationConfig } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId");
    const conversations = await getAllAIConversations(patientId ?? undefined);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConversationConfig;

    // Validate required fields
    if (!body.title || !body.systemPrompt) {
      return NextResponse.json(
        { error: "title and systemPrompt are required" },
        { status: 400 }
      );
    }

    const conversationId = uuidv4();
    let context = body.context || "";

    // If sessionId is provided, fetch and prepend memory annotation to context
    if (body.sessionId) {
      const memoryInfo = await getMemoryAnnotationBySessionId(body.sessionId);
      if (memoryInfo) {
        const memoryContext = `Memory: ${memoryInfo.title}\n${memoryInfo.annotation ? `Notes: ${memoryInfo.annotation}` : ""}`;
        context = context ? `${memoryContext}\n\n${context}` : memoryContext;
      }
    }

    await createAIConversation(
      conversationId,
      body.title,
      body.systemPrompt,
      context || undefined,
      body.sessionId,
      body.patientId,
      body.model,
      body.temperature,
      body.maxTokens
    );

    return NextResponse.json(
      {
        conversationId,
        title: body.title,
        model: body.model || "gpt-4o-mini",
        status: "active",
        message: "Conversation started. Use /api/conversations/[conversationId]/messages to chat.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
