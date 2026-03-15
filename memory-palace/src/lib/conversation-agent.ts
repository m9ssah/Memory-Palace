import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OpenAI credentials. Set OPENAI_API_KEY before calling conversation APIs.",
    );
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

export interface ConversationAgentConfig {
  systemPrompt: string;
  context?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface MessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Conversation Agent Service
 * Handles OpenAI API interactions for conversational AI
 */
export class ConversationAgent {
  private systemPrompt: string;
  private context?: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private messageHistory: MessageInput[] = [];

  constructor(config: ConversationAgentConfig) {
    this.systemPrompt = config.systemPrompt;
    this.context = config.context;
    this.model = config.model || "gpt-4o-mini";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 1000;

    // Initialize with system message
    this.messageHistory.push({
      role: "system",
      content: this.buildSystemMessage(),
    });
  }

  /**
   * Build the full system message by combining prompt and context
   */
  private buildSystemMessage(): string {
    let message = this.systemPrompt;
    if (this.context) {
      message += "\n\nContext:\n" + this.context;
    }
    return message;
  }

  /**
   * Add a message to the history
   */
  addMessage(role: "user" | "assistant", content: string): void {
    this.messageHistory.push({ role, content });
  }

  /**
   * Get the current message history
   */
  getHistory(): MessageInput[] {
    return this.messageHistory;
  }

  /**
   * Reset message history (keep system prompt)
   */
  resetHistory(): void {
    this.messageHistory = [
      {
        role: "system",
        content: this.buildSystemMessage(),
      },
    ];
  }

  /**
   * Send a message and get a response from OpenAI
   */
  async sendMessage(userMessage: string): Promise<{
    message: string;
    tokensUsed?: number;
    totalTokens?: number;
  }> {
    try {
      const openai = getOpenAIClient();

      // Add user message to history
      this.addMessage("user", userMessage);

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: this.messageHistory as any,
        temperature: this.temperature,
        max_completion_tokens: this.maxTokens,
      });

      // Extract assistant response
      const assistantMessage =
        response.choices[0]?.message?.content ||
        "No response generated";

      // Add assistant response to history
      this.addMessage("assistant", assistantMessage);

      // Return response with token usage
      return {
        message: assistantMessage,
        tokensUsed: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      };
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error(
        `Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Transcribe audio to text using Whisper API
   */
  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      const openai = getOpenAIClient();
      const uint8Array = new Uint8Array(audioBuffer);
      const response = await openai.audio.transcriptions.create({
        file: new File([uint8Array], "audio.wav", { type: "audio/wav" }),
        model: "whisper-1",
      });

      return response.text;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw new Error(
        `Failed to transcribe audio: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate speech from text using TTS API
   */
  async generateSpeech(
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova",
  ): Promise<ArrayBuffer> {
    try {
      const openai = getOpenAIClient();
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
      });

      // Convert response to ArrayBuffer
      const buffer = await response.arrayBuffer();
      return buffer;
    } catch (error) {
      console.error("Error generating speech:", error);
      throw new Error(
        `Failed to generate speech: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(): {
    messageCount: number;
    turns: number;
    hasContext: boolean;
  } {
    // Filter out system message for counting
    const userMessages = this.messageHistory.filter((m) => m.role === "user");
    return {
      messageCount: this.messageHistory.length,
      turns: userMessages.length,
      hasContext: !!this.context,
    };
  }

  /**
   * Update system prompt dynamically
   */
  updateSystemPrompt(newSystemPrompt: string): void {
    this.systemPrompt = newSystemPrompt;
    // Update the system message in history
    this.messageHistory[0] = {
      role: "system",
      content: this.buildSystemMessage(),
    };
  }

  /**
   * Update context dynamically
   */
  updateContext(newContext: string | undefined): void {
    this.context = newContext;
    // Update the system message in history
    this.messageHistory[0] = {
      role: "system",
      content: this.buildSystemMessage(),
    };
  }
}

/**
 * Helper function to create a conversation agent
 */
export function createConversationAgent(
  config: ConversationAgentConfig,
): ConversationAgent {
  return new ConversationAgent(config);
}
