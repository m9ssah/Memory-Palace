import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getAIConversation,
  getAIMessages,
  addAIMessage,
  getAIConversationWithMessages,
} from "@/lib/db";
import {
  createConversationAgent,
  ConversationAgent,
} from "@/lib/conversation-agent";

// Store active conversation agents in memory (in production, consider using Redis or similar)
const conversationAgents = new Map<string, ConversationAgent>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const body = await request.json();
    const { userMessage } = body;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "userMessage is required and must be a string" },
        { status: 400 }
      );
    }

    // Get conversation config
    const conversation = await getAIConversation(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Initialize or retrieve agent
    let agent = conversationAgents.get(conversationId);
    if (!agent) {
      // Get all previous messages to Initialize agent with history
      const previousMessages = await getAIMessages(conversationId);

      agent = createConversationAgent({
        systemPrompt: conversation.system_prompt,
        context: conversation.context,
        model: conversation.model,
        temperature: conversation.temperature,
        maxTokens: conversation.max_tokens,
      });

      // Add previous messages to agent history
      for (const msg of previousMessages) {
        if (msg.role !== "system") {
          agent.addMessage(msg.role as "user" | "assistant", msg.content);
        }
      }

      conversationAgents.set(conversationId, agent);
    }

    // Add user message to database
    const userMessageId = uuidv4();
    await addAIMessage(conversationId, userMessageId, "user", userMessage);

    // Get AI response
    const responseData = await agent.sendMessage(userMessage);
    const assistantMessage = responseData.message;
    const tokensUsed = responseData.tokensUsed;

    // Add assistant message to database
    const assistantMessageId = uuidv4();
    await addAIMessage(
      conversationId,
      assistantMessageId,
      "assistant",
      assistantMessage,
      tokensUsed
    );

    // Get updated conversation with all messages
    const updatedConversation = await getAIConversationWithMessages(conversationId);

    return NextResponse.json(
      {
        conversationId,
        userMessage,
        assistantMessage,
        tokensUsed,
        summary: agent.getConversationSummary(),
        conversation: updatedConversation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing message:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process message", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const messages = await getAIMessages(conversationId);

    return NextResponse.json({
      conversationId,
      messages,
      count: messages?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * Clear conversation agent from memory
 * Call this when ending a conversation to free up resources
 */
export function clearConversationAgent(conversationId: string): void {
  conversationAgents.delete(conversationId);
}
