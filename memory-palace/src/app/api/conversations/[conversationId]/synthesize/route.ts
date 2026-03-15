import { NextRequest, NextResponse } from "next/server";
import { createConversationAgent } from "@/lib/conversation-agent";
import { getAIConversation } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const body = await request.json();
    const { text, voice = "nova" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate voice option
    const validVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
    if (!validVoices.includes(voice)) {
      return NextResponse.json(
        {
          error: `Invalid voice. Must be one of: ${validVoices.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Get conversation config for agent
    const conversation = await getAIConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Create agent temporarily for speech generation
    const agent = createConversationAgent({
      systemPrompt: conversation.system_prompt,
      context: conversation.context,
      model: conversation.model,
      temperature: conversation.temperature,
      maxTokens: conversation.max_tokens,
    });

    // Generate speech
    const audioBuffer = await agent.generateSpeech(
      text,
      voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
    );

    // Return audio as binary response
    return new NextResponse(Buffer.from(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=response.mp3",
        "Cache-Control": "no-cache",
      },
    } as any);
  } catch (error) {
    console.error("Error generating speech:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate speech", details: errorMessage },
      { status: 500 }
    );
  }
}
