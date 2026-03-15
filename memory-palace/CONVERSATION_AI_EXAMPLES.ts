/**
 * Conversational AI - Example Usage & Testing
 * 
 * FOCUS: Memory Annotation Feature
 * 
 * This file demonstrates how to use the conversational AI endpoints with emphasis on
 * the automatic memory annotation loading feature. When you provide a sessionId,
 * the system automatically fetches the memory's title and annotation and prepends
 * them to the conversation context.
 */

// ============================================================================
// BACKEND EXAMPLES (Node.js / Next.js API Routes)
// ============================================================================

// Example 1: Creating a Conversation WITH AUTO-LOADED Memory Annotation
// ============================================================================
import { createConversationAgent, ConversationAgent } from "@/lib/conversation-agent";
import { 
  createAIConversation, 
  addAIMessage, 
  getAIConversationWithMessages,
  getMemoryAnnotationBySessionId 
} from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

/**
 * MEMORY ANNOTATION FEATURE:
 * 
 * When you create a conversation with a sessionId, the system:
 * 1. Finds the memory linked to that session
 * 2. Fetches the memory's title and annotation
 * 3. Prepends them to the conversation context
 * 
 * This gives the AI immediate context about what memory is being discussed.
 */
async function createConversationWithMemoryContext() {
  const sessionId = "session-wedding-day-1975"; // Linked to a memory in your database
  const conversationId = uuidv4();
  
  // Manually show what gets fetched automatically
  const memoryInfo = await getMemoryAnnotationBySessionId(sessionId);
  console.log("Memory fetched for context:", memoryInfo);
  // Output example:
  // {
  //   title: "Wedding Day 1975",
  //   annotation: "Married Jane at St. Michael's Church. 200 guests. Rainy morning, sunny reception. Best day of my life."
  // }

  // Create conversation - context will be AUTOMATICALLY populated!
  // No need to manually pass the context - it auto-loads from the memory
  await createAIConversation(
    conversationId,
    "Discussing Wedding Day Memory",
    "You are a compassionate memory companion. Help the patient explore and celebrate their cherished wedding day memory. Ask gentle questions about the people, emotions, and details they remember.",
    // Context is OPTIONAL because it auto-loads from memory annotation!
    undefined, // Omit: auto-loaded from sessionId
    sessionId, // This triggers automatic annotation loading
    "default",
    "gpt-4o-mini",
    0.6,
    800
  );

  // Create agent with the context that includes memory annotation
  // Inside the route handler, the annotation is automatically prepended
  const agent = createConversationAgent({
    systemPrompt: "You are a compassionate memory companion. Help the patient explore and celebrate their cherished wedding day memory. Ask gentle questions about the people, emotions, and details they remember.",
    context: `Memory: Wedding Day 1975\nNotes: Married Jane at St. Michael's Church. 200 guests. Rainy morning, sunny reception. Best day of my life.`,
    model: "gpt-4o-mini",
    temperature: 0.6,
    maxTokens: 800,
  });

  // Simulate a conversation - AI is already informed about the memory
  const userMessage = "Tell me, what was the weather like that day?";
  const userMsgId = uuidv4();
  await addAIMessage(conversationId, userMsgId, "user", userMessage);

  const response = await agent.sendMessage(userMessage);
  const assistantMsgId = uuidv4();
  await addAIMessage(conversationId, assistantMsgId, "assistant", response.message, response.tokensUsed);

  console.log("Patient:", userMessage);
  console.log("Assistant (informed by memory annotation):", response.message);
  // Assistant will reference the rainy morning from the annotation!
  
  const fullConversation = await getAIConversationWithMessages(conversationId);
  console.log("Full conversation with memory context:", fullConversation);
}

// Example 1b: Without sessionId (manual context)
// ============================================================================
async function createConversationWithManualContext() {
  const conversationId = uuidv4();
  
  // Manual context - useful when NO sessionId available
  const manualContext = "Patient is reminiscing about their childhood home. They lived there from 1945-1965. It was a Victorian house with a large garden where they played as a child.";
  
  await createAIConversation(
    conversationId,
    "Childhood Home Discussion",
    "Help the patient recall details about their childhood home.",
    manualContext, // Manually provided
    undefined, // No sessionId
    "default",
    "gpt-4o-mini",
    0.7,
    800
  );

  const agent = createConversationAgent({
    systemPrompt: "Help the patient recall details about their childhood home.",
    context: manualContext,
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 800,
  });

  const response = await agent.sendMessage("What was my favorite place in the house?");
  console.log("AI response with manual context:", response.message);
}

// ============================================================================
// FRONTEND EXAMPLES (React / JavaScript)
// ============================================================================

// Example 2: React Hook for Conversations WITH Memory Context
// ============================================================================
/**
 * MEMORY ANNOTATION CONTEXT:
 * 
 * Pass sessionId to automatically include memory annotation in context:
 * - No need to manually fetch or format the annotation
 * - System automatically prepends: "Memory: [title]\nNotes: [annotation]"
 * - AI receives full context about the memory being discussed
 */

interface UseConversationOptions {
  title: string;
  systemPrompt: string;
  context?: string; // Optional: only needed if NOT using sessionId
  patientId?: string;
  sessionId?: string; // Preferred: auto-loads memory annotation
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

function useConversation(options: UseConversationOptions) {
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ConversationMessage[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [contextLoaded, setContextLoaded] = React.useState(false);

  // Initialize conversation - AUTO loads memory annotation if sessionId provided
  const startConversation = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: options.title,
          systemPrompt: options.systemPrompt,
          context: options.context, // Optional: will be merged with auto-loaded annotation
          patientId: options.patientId,
          sessionId: options.sessionId, // This triggers auto-loading of memory annotation!
        }),
      });
      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages([]);
      setContextLoaded(!!options.sessionId); // Mark that context was auto-loaded
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setLoading(false);
    }
  }, [options]);

  // Send message
  const sendMessage = React.useCallback(
    async (userMessage: string) => {
      if (!conversationId) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage }),
          }
        );
        const data = await response.json();

        // Update messages
        setMessages((prev) => [
          ...prev,
          { id: uuidv4(), role: "user", content: userMessage, createdAt: new Date().toISOString() },
          {
            id: uuidv4(),
            role: "assistant",
            content: data.assistantMessage,
            createdAt: new Date().toISOString(),
          },
        ]);
        setError(null);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  // Return all hook methods
  return {
    conversationId,
    messages,
    loading,
    error,
    contextLoaded,
    startConversation,
    sendMessage,
  };
}

// Example 2b: React Component Using Memory Context
// ============================================================================
/**
function MemoryConversationComponent({ sessionId }: { sessionId: string }) {
  const {
    conversationId,
    messages,
    loading,
    error,
    contextLoaded,
    startConversation,
    sendMessage,
  } = useConversation({
    title: "Memory Exploration",
    systemPrompt: "You are a compassionate companion helping the patient explore their cherished memories. Reference details from their memory annotations in your responses.",
    sessionId: sessionId, // Auto-loads memory annotation!
    patientId: "default",
  });

  const [userInput, setUserInput] = React.useState("");

  React.useEffect(() => {
    startConversation();
  }, [startConversation]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    setUserInput("");
    await sendMessage(userInput);
  };

  return (
    <div className="memory-conversation">
      <h2>Memory Conversation</h2>
      {contextLoaded && (
        <div className="context-indicator">
          ✓ Memory annotation loaded automatically
        </div>
      )}
      {error && <div className="error">{error}</div>}
      
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>{msg.role === "user" ? "You" : "Memory Companion"}:</strong>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Share your thoughts about this memory..."
          disabled={loading}
        />
        <button onClick={handleSendMessage} disabled={loading || !conversationId}>
          {loading ? "Processing..." : "Send"}
        </button>
      </div>
    </div>
  );
}
*/

// Example 3: Voice Conversation WITH Memory Context
// ============================================================================
/**
interface UseVoiceConversationOptions extends UseConversationOptions {
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

async function recordAudio(): Promise<Blob> {
  // This is a simplified example. In production, use a library like react-mic or MediaRecorder API
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: "audio/wav" }));
    };
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // Record for 5 seconds
  });
}

function useVoiceConversation(options: UseVoiceConversationOptions) {
  const {
    conversationId,
    messages,
    loading,
    error,
    startConversation,
    sendMessage,
  } = useConversation(options);
  
  const voice = options.voice || "nova";
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Send voice message
  const sendVoiceMessage = React.useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading;
      // Record audio
      const audioBlob = await recordAudio();

      // Transcribe audio
      const formData = new FormData();
      formData.append("audio", audioBlob);
      const transcribeResponse = await fetch(
        `/api/conversations/${conversationId}/transcribe`,
        {
          method: "POST",
          body: formData,
        }
      );
      const { transcribedText } = await transcribeResponse.json();

      // Send transcribed text to get response
      const messageResponse = await sendMessage(transcribedText);
      if (!messageResponse) return;

      // Generate speech for response
      const speechResponse = await fetch(
        `/api/conversations/${conversationId}/synthesize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: messageResponse.assistantMessage,
            voice,
          }),
        }
      );

      const audioUrl = URL.createObjectURL(await speechResponse.blob());
      
      // Play audio
      setIsPlaying(true);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (err) {
      console.error("Voice conversation error:", err);
    }
  }, [conversationId, sendMessage, voice]);

  return {
    conversationId,
    messages,
    loading,
    error,
    isPlaying,
    startConversation,
    sendMessage,
    sendVoiceMessage,
  };
}
*/

// Example 4: Using the Hook in a React Component
// ============================================================================
/**
function MemoryConversationComponent() {
  const {
    conversationId,
    messages,
    loading,
    error,
    startConversation,
    sendMessage,
  } = useConversation({
    title: "Memory Recall Session",
    systemPrompt:
      "You are a compassionate memory recall specialist. Help the patient remember and discuss their memories.",
    context: "Patient at our facility for memory therapy.",
    patientId: "default",
  });

  const [userInput, setUserInput] = React.useState("");

  React.useEffect(() => {
    startConversation();
  }, [startConversation]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    setUserInput("");
    await sendMessage(userInput);
  };

  return (
    <div className="conversation-container">
      <h2>Memory Conversation</h2>
      {error && <div className="error">{error}</div>}
      
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={handleSendMessage} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
*/

// Example 5: cURL Testing Examples WITH Memory Annotations
// ============================================================================

/**
 * cURL Commands for Testing - Focus: Memory Annotation Auto-Loading
 * 
 * When you provide a sessionId, the memory's annotation is AUTOMATICALLY fetched
 * and prepended to the conversation context. No manual work needed!
 * 
 * SESSION SETUP (assume you have a session linked to a memory with annotation):
 * Memory: "Wedding Day 1975"
 * Annotation: "Married Jane at St. Michael's Church. 200 guests. Rainy morning, sunny reception."
 * 
 * 1. CREATE CONVERSATION WITH AUTO-LOADED MEMORY ANNOTATION
 * curl -X POST http://localhost:3000/api/conversations \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "title": "Discussing Wedding Day",
 *     "systemPrompt": "Help the patient explore and celebrate this cherished memory. Reference the details from their memory in your responses.",
 *     "sessionId": "session-wedding-1975",
 *     "patientId": "default"
 *   }'
 *
 * Response:
 * {
 *   "conversationId": "uuid-123",
 *   "title": "Discussing Wedding Day",
 *   "status": "active",
 *   ...
 * }
 * 
 * BEHIND THE SCENES: System automatically:
 * 1. Finds the memory linked to "session-wedding-1975"
 * 2. Fetches title: "Wedding Day 1975"
 * 3. Fetches annotation: "Married Jane at St. Michael's Church..."
 * 4. Prepends to context: "Memory: Wedding Day 1975\nNotes: Married Jane at St. Michael's Church..."
 *
 *
 * 2. SEND A MESSAGE (AI has full memory context from step 1)
 * curl -X POST http://localhost:3000/api/conversations/uuid-123/messages \
 *   -H "Content-Type: application/json" \
 *   -d '{"userMessage": "What was the weather like that day?"}'
 *
 * Response:
 * {
 *   "userMessage": "What was the weather like that day?",
 *   "assistantMessage": "According to your memories, it was quite atmospheric - a rainy morning that cleared up beautifully for your reception at St. Michael's Church. What other details do you remember about that special day?",
 *   ...
 * }
 * 
 * AI Response is INFORMED by the memory annotation loaded automatically!
 *
 *
 * 3. GET FULL CONVERSATION WITH CONTEXT
 * curl http://localhost:3000/api/conversations/uuid-123
 *
 * Response:
 * {
 *   "id": "uuid-123",
 *   "title": "Discussing Wedding Day",
 *   "context": "Memory: Wedding Day 1975\nNotes: Married Jane at St. Michael's Church. 200 guests. Rainy morning, sunny reception.",
 *   "ai_messages": [
 *     {
 *       "role": "user",
 *       "content": "What was the weather like that day?"
 *     },
 *     {
 *       "role": "assistant",
 *       "content": "According to your memories..."
 *     }
 *   ],
 *   ...
 * }
 *
 *
 * 4. ALTERNATIVE: CREATE CONVERSATION WITH MANUAL CONTEXT (no sessionId)
 * curl -X POST http://localhost:3000/api/conversations \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "title": "Childhood Memories",
 *     "systemPrompt": "Help the patient recall their childhood.",
 *     "context": "Patient grew up in a Victorian house with a large garden from 1945-1965.",
 *     "patientId": "default"
 *   }'
 *
 * Use this when you don't have a sessionId but want to provide manual context
 *
 *
 * 5. TRANSCRIBE VOICE (works with auto-loaded memory context too)
 * curl -X POST http://localhost:3000/api/conversations/uuid-123/transcribe \
 *   -F "audio=@patient-voice-input.wav"
 *
 * Response:
 * {"transcribedText": "I remember it was such a beautiful ceremony", ...}
 *
 *
 * 6. GENERATE SPEECH (AI uses memory context to create informed responses)
 * curl -X POST http://localhost:3000/api/conversations/uuid-123/synthesize \
 *   -H "Content-Type: application/json" \
 *   -d '{"text":"Your wedding day was truly special","voice":"nova"}' \
 *   -o response.mp3
 *
 *
 * 7. END CONVERSATION
 * curl -X PATCH http://localhost:3000/api/conversations/uuid-123 \
 *   -H "Content-Type: application/json" \
 *   -d '{"status":"ended"}'
*/

// Example 5: Python Testing (for backend developers)
// ============================================================================

/**
import requests
import json

BASE_URL = "http://localhost:3000"

# =========================================
# MEMORY ANNOTATION AUTO-LOADING EXAMPLE
# =========================================

# Session linked to a memory with annotation:
session_id = "session-wedding-1975"

# 1. Create conversation - MEMORY ANNOTATION LOADS AUTOMATICALLY
response = requests.post(
    f"{BASE_URL}/api/conversations",
    json={
        "title": "Discussing Wedding Day",
        "systemPrompt": "Help explore and celebrate this cherished memory.",
        "sessionId": session_id,  # Auto-loads memory annotation!
        "patientId": "default"
    }
)
conversation_id = response.json()["conversationId"]
print(f"✓ Conversation created with auto-loaded memory context")
print(f"  Conversation ID: {conversation_id}")
# Behind the scenes:
# - System fetched memory title: "Wedding Day 1975"
# - System fetched annotation: "Married Jane at St. Michael's Church..."
# - Both automatically prepended to conversation context


# 2. Send message - AI response informed by memory annotation
response = requests.post(
    f"{BASE_URL}/api/conversations/{conversation_id}/messages",
    json={"userMessage": "Tell me about the ceremony"}
)
data = response.json()
print(f"\nPatient: {data['userMessage']}")
print(f"AI (informed by memory): {data['assistantMessage']}")


# 3. Get full conversation to see context with memory annotation
response = requests.get(f"{BASE_URL}/api/conversations/{conversation_id}")
conv = response.json()
print(f"\nConversation Context (includes auto-loaded memory annotation):")
print(conv['context'])
# Output:
# Memory: Wedding Day 1975
# Notes: Married Jane at St. Michael's Church. 200 guests. Rainy morning, sunny reception.


# 4. Multi-turn conversation - AI maintains context throughout
messages = [
    "Tell me about Jane",
    "How many people attended?",
    "What was your favorite moment?"
]

for msg in messages:
    response = requests.post(
        f"{BASE_URL}/api/conversations/{conversation_id}/messages",
        json={"userMessage": msg}
    )
    data = response.json()
    print(f"\nPatient: {msg}")
    print(f"AI: {data['assistantMessage'][:100]}...")


# 5. Verify conversation ended properly
response = requests.patch(
    f"{BASE_URL}/api/conversations/{conversation_id}",
    json={"status": "ended"}
)
print(f"\n✓ Conversation ended: {response.json()['success']}")
*/

// ============================================================================
// KEY TAKEAWAYS: MEMORY ANNOTATION FEATURE
// ============================================================================

/**
1. AUTOMATIC CONTEXT LOADING
   - Pass sessionId to conversation creation
   - System automatically fetches memory annotation
   - No manual context formatting needed

2. WHAT GETS AUTO-LOADED
   - Memory title: Used in context header
   - Memory annotation: Full notes about the memory
   - Format: "Memory: [title]\nNotes: [annotation]"

3. AI RESPONSE QUALITY
   - AI is informed about the memory from the start
   - Produces coherent, contextually-aware responses
   - References details from the annotation
   - Great for memory recall conversations

4. USAGE PATTERN
   ```
   POST /api/conversations
   {
     "sessionId": "session-id",  // KEY: Provides memory context
     "systemPrompt": "...",
     "title": "..."
   }
   ```

5. COST EFFICIENCY
   - Once annotation is loaded, all messages use it
   - No need to repeat context in each message
   - Lower token usage overall
   - Better conversation flow

6. WHEN TO USE
   - ✅ Memory recall sessions (user has sessionId)
   - ✅ Therapeutic conversations about specific memories
   - ✅ Patient education about their own memory details
   - ❌ Generic conversations without specific memory
   - ❌ Multi-memory sessions

7. HOW IT WORKS INTERNALLY
   - Server receives POST /conversations with sessionId
   - Calls getMemoryAnnotationBySessionId(sessionId)
   - Fetches memory title and annotation
   - Prepends to user-provided context (if any)
   - Creates conversation with enriched context
   - AI has full memory detail from message 1
*/

// ============================================================================
// PERFORMANCE & OPTIMIZATION TIPS
// ============================================================================

/**
1. Memory Annotation Loading:
   - Happens once per conversation creation
   - Cached in conversation context for all messages
   - No repeated database calls
   - Efficient for long conversations

2. Message Caching:
   - Store conversation state in React Context or Redux
   - Avoid re-fetching messages unnecessarily
   - Implement message pagination for long conversations

3. Voice Processing:
   - Consider client-side audio compression before uploading
   - Cache generated speech URLs to avoid redundant API calls
   - Use web workers for audio processing to avoid blocking UI

4. Rate Limiting:
   - Implement client-side request throttling
   - Add rate limiting middleware on backend
   - Consider implementing a queue for voice messages

5. Token Management:
   - Monitor token usage returned in API responses (includes memory context tokens)
   - Implement a token usage dashboard
   - Set reasonable maxTokens to control costs

6. Error Recovery:
   - Implement exponential backoff for retries
   - Show user-friendly error messages
   - Persist conversation state to recover from failures

7. Database Optimization:
   - Indexes already created on session_id, patient_id, status, created_at
   - Archive old conversations to maintain performance
   - Use database cursors for pagination
*/

// ============================================================================
// NEXT STEPS
// ============================================================================

/**
1. Frontend Integration:
   - Build conversation UI components with memory context display
   - Add audio recording/playback
   - Implement real-time message updates

2. Advanced Features with Memory Context:
   - Memory timeline visualization during conversation
   - Sentiment analysis of patient responses about memory
   - Conversation summarization with memory references
   - Multi-turn context management with memory awareness

3. Production Deployment:
   - Set up proper error logging
   - Implement request rate limiting
   - Add authentication/authorization
   - Set up OpenAI cost monitoring
   - Configure backup and recovery

4. Testing:
   - Unit tests for memory annotation loading
   - Integration tests for API endpoints with sessionId
   - Load testing for concurrent conversations with memory context
   - Voice quality testing with memory context

5. Analytics:
   - Track conversation duration and engagement with memory context
   - Monitor AI response quality metrics for memory-informed responses
   - Analyze how memory context affects patient satisfaction
   - Cost per conversation tracking including memory context tokens
*/

