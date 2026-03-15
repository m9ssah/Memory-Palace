import { NextRequest, NextResponse } from "next/server";
import { createConversationAgent } from "@/lib/conversation-agent";
import { getAIConversation, addAIMessage } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    // Get conversation config for agent
    const conversation = await getAIConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Create agent temporarily for transcription
    const agent = createConversationAgent({
      systemPrompt: conversation.system_prompt,
      context: conversation.context,
      model: conversation.model,
      temperature: conversation.temperature,
      maxTokens: conversation.max_tokens,
    });

    // Convert File to Buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Transcribe audio
    const transcribedText = await agent.transcribeAudio(audioBuffer);

    // Save transcribed message
    const userMessageId = uuidv4();
    await addAIMessage(conversationId, userMessageId, "user", transcribedText);

    return NextResponse.json(
      {
        conversationId,
        transcribedText,
        status: "transcribed",
        message: "Audio transcribed successfully. Use /messages endpoint to get AI response.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error transcribing audio:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to transcribe audio", details: errorMessage },
      { status: 500 }
    );
  }
}
