# Conversational AI Agent API Documentation

## Overview

The conversational AI agent infrastructure integrates OpenAI's GPT models with your Memory Palace application. It supports text-based conversations, audio transcription (Whisper), and speech synthesis (TTS).

## Architecture

### Components

1. **ConversationAgent Service** (`src/lib/conversation-agent.ts`)
   - Manages conversation state and history
   - Handles OpenAI API interactions
   - Supports audio transcription and synthesis

2. **Database** (Supabase)
   - `ai_conversations`: Stores conversation sessions
   - `ai_messages`: Stores individual messages

3. **API Endpoints**
   - `/api/conversations` - Create and list conversations
   - `/api/conversations/[conversationId]` - Get/update conversation
   - `/api/conversations/[conversationId]/messages` - Send messages
   - `/api/conversations/[conversationId]/transcribe` - Transcribe audio
   - `/api/conversations/[conversationId]/synthesize` - Generate speech

## Environment Setup

Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=sk-...your-key-here...
```

## API Endpoints

### 1. Create a Conversation

**Endpoint:** `POST /api/conversations`

**Purpose:** Initialize a new conversation session with a system prompt and optional context.

**Request Body:**
```json
{
  "title": "Memory Discussion",
  "systemPrompt": "You are a compassionate AI assistant helping patients recall and discuss their memories.",
  "context": "Patient is a 75-year-old with early-stage dementia. Current memory being discussed: their wedding day in 1975.",
  "sessionId": "optional-session-id",
  "patientId": "optional-patient-id",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "maxTokens": 1000
}
```

**Parameters:**
- `title` (required): Display name for the conversation
- `systemPrompt` (required): Instructions for the AI agent
- `context` (optional): Background information about the conversation
  - **Auto-populated from annotation**: If `sessionId` is provided and the linked memory has an annotation, it will be automatically prepended to the context
- `sessionId` (optional): Link to an existing session
  - **Auto-fetches annotation**: When provided, the memory's title and annotation from this session are automatically included in the conversation context
- `patientId` (optional): Link to a patient record
- `model` (optional, default: "gpt-4o-mini"): OpenAI model to use
- `temperature` (optional, default: 0.7): 0-2, higher = more creative, lower = more consistent
- `maxTokens` (optional, default: 1000): Maximum response length

**Response:**
```json
{
  "conversationId": "uuid",
  "title": "Memory Discussion",
  "model": "gpt-4o-mini",
  "status": "active",
  "message": "Conversation started. Use /api/conversations/[conversationId]/messages to chat."
}
```

**Status Code:** 201 Created

---

### 2. Get Conversation Details

**Endpoint:** `GET /api/conversations/[conversationId]`

**Purpose:** Retrieve full conversation details including all messages.

**Response:**
```json
{
  "id": "uuid",
  "title": "Memory Discussion",
  "system_prompt": "You are a compassionate AI assistant...",
  "context": "Patient is a 75-year-old with early-stage dementia...",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 1000,
  "status": "active",
  "started_at": "2026-03-15T10:30:00Z",
  "ended_at": null,
  "ai_messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Tell me about my wedding day",
      "tokens_used": 15,
      "created_at": "2026-03-15T10:31:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "I'd love to help you remember your wedding day...",
      "tokens_used": 62,
      "created_at": "2026-03-15T10:31:05Z"
    }
  ]
}
```

---

### 3. Send a Message

**Endpoint:** `POST /api/conversations/[conversationId]/messages`

**Purpose:** Send a user message and receive an AI response.

**Request Body:**
```json
{
  "userMessage": "Tell me more about that day"
}
```

**Response:**
```json
{
  "conversationId": "uuid",
  "userMessage": "Tell me more about that day",
  "assistantMessage": "Of course! Your wedding day in 1975 was...",
  "tokensUsed": 45,
  "summary": {
    "messageCount": 6,
    "turns": 3,
    "hasContext": true
  },
  "conversation": {
    "id": "uuid",
    "title": "Memory Discussion",
    "ai_messages": [...]
  }
}
```

**Status Code:** 200 OK

---

### 4. Transcribe Audio

**Endpoint:** `POST /api/conversations/[conversationId]/transcribe`

**Purpose:** Convert audio to text using OpenAI's Whisper API.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `audio` (File) - WAV, MP3, or other supported audio format

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/conversations/[conversationId]/transcribe \
  -F "audio=@audio.wav"
```

**Response:**
```json
{
  "conversationId": "uuid",
  "transcribedText": "Tell me about my wedding day",
  "status": "transcribed",
  "message": "Audio transcribed successfully. Use /messages endpoint to get AI response."
}
```

---

### 5. Generate Speech

**Endpoint:** `POST /api/conversations/[conversationId]/synthesize`

**Purpose:** Convert text to speech using OpenAI's TTS API.

**Request Body:**
```json
{
  "text": "Your wedding day was a beautiful occasion...",
  "voice": "nova"
}
```

**Parameters:**
- `text` (required): Text to convert to speech
- `voice` (optional, default: "nova"): One of: alloy, echo, fable, onyx, nova, shimmer

**Response:**
- Content-Type: `audio/mpeg`
- Binary audio data (MP3 format)

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/conversations/[conversationId]/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello patient","voice":"nova"}' \
  -o response.mp3
```

---

### 6. List Conversations

**Endpoint:** `GET /api/conversations?patientId=[optional]`

**Purpose:** Retrieve all conversations, optionally filtered by patient.

**Query Parameters:**
- `patientId` (optional): Filter by patient ID

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Memory Discussion",
    "status": "active",
    "started_at": "2026-03-15T10:30:00Z",
    ...
  }
]
```

---

### 7. Update Conversation Status

**Endpoint:** `PATCH /api/conversations/[conversationId]`

**Purpose:** Update conversation status (e.g., to end it).

**Request Body:**
```json
{
  "status": "ended"
}
```

**Valid Status Values:**
- `active`: Conversation in progress
- `paused`: Conversation paused
- `ended`: Conversation completed

**Response:**
```json
{
  "success": true,
  "conversationId": "uuid",
  "status": "ended"
}
```

---

## Usage Examples

### Example 1: Full Text Conversation Flow

```javascript
// 1. Create conversation
const convResponse = await fetch('/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Memory Session',
    systemPrompt: 'You are a helpful memory recall assistant for dementia patients.',
    context: 'Patient enjoyed gardening. Currently discussing their first garden.',
    patientId: 'default'
  })
});
const { conversationId } = await convResponse.json();

// 2. Send message
const msgResponse = await fetch(`/api/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userMessage: 'What was my first garden like?'
  })
});
const { assistantMessage } = await msgResponse.json();

// 3. Generate speech from response
const speechResponse = await fetch(
  `/api/conversations/${conversationId}/synthesize`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: assistantMessage,
      voice: 'nova'
    })
  }
);
const audioBlob = await speechResponse.blob();
const audioUrl = URL.createObjectURL(audioBlob);
```

### Example 2: Voice Input Flow

```javascript
// 1. Record audio from user
const audioBlob = await recordUserAudio(); // Your audio recording function

// 2. Transcribe audio
const formData = new FormData();
formData.append('audio', audioBlob);
const transcribeResponse = await fetch(
  `/api/conversations/${conversationId}/transcribe`,
  {
    method: 'POST',
    body: formData
  }
);
const { transcribedText } = await transcribeResponse.json();

// 3. Send transcribed message to get AI response
const msgResponse = await fetch(`/api/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userMessage: transcribedText })
});
const { assistantMessage } = await msgResponse.json();

// 4. Generate speech from AI response
const speechResponse = await fetch(
  `/api/conversations/${conversationId}/synthesize`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: assistantMessage })
  }
);
const audioUrl = URL.createObjectURL(await speechResponse.blob());
// Play audioUrl to patient
```

### Example 3: Using Memory Annotations Automatically

```javascript
// When starting a conversation for an existing session/memory,
// the memory's annotation is automatically fetched and included in context

const sessionId = 'your-session-id'; // Existing session linked to a memory

// 1. Create conversation with sessionId
// The memory's title and annotation will automatically be included in context
const convResponse = await fetch('/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Reviewing Memory',
    systemPrompt: 'You are a compassionate memory recall assistant. Help the patient discuss and explore their memory.',
    sessionId: sessionId, // This automatically loads memory annotation!
    // Context from memory will be prepended automatically
    patientId: 'default'
  })
});
const { conversationId } = await convResponse.json();

// 2. The AI now has full context from the memory
const msgResponse = await fetch(`/api/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userMessage: 'Tell me more about this memory'
  })
});
const { assistantMessage } = await msgResponse.json();
// assistantMessage will be informed by the memory's annotation and context

// 3. View the conversation with its context
const fullConv = await fetch(`/api/conversations/${conversationId}`).then(r => r.json());
console.log('Context with memory annotation:', fullConv.context);
```

---

## Prompt Design Tips

### For Memory Recall
```
You are a compassionate memory recall assistant specializing in helping dementia patients. 
Your role is to:
1. Ask gentle, open-ended questions about memories
2. Help fill in details with patient feedback
3. Validate and affirm their recollections
4. Never correct or contradict their memories
5. Be patient and encouraging

Focus on sensory details: sights, sounds, smells, feelings.
Keep responses warm and conversational.
```

### For Therapeutic Support
```
You are a supportive therapeutic chatbot for people with memory concerns.
Provide:
- Emotional validation
- Gentle encouragement
- Positive reinforcement
- Coping strategies suggestions

Be warm, empathetic, and never diagnostic.
```

---

## Configuration & Best Practices

### Model Selection
- **gpt-4o-mini** (default): Fast, cost-effective, good for conversations
- **gpt-4**: Higher quality, better reasoning, slower and more expensive

### Temperature Settings
- **0.3-0.5**: Factual, consistent responses (good for memory recall)
- **0.7** (default): Balanced creativity and consistency
- **0.9-1.2**: More creative and varied responses

### Token Usage
- Monitor `tokensUsed` returned in responses
- Each conversation saves tokens used to database
- Higher `maxTokens` allows longer responses but costs more

---

## Error Handling

Common error responses:

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing required fields | `title` or `systemPrompt` not provided |
| 404 | Conversation not found | Invalid `conversationId` |
| 500 | OpenAI API error | Invalid API key or API rate limit |
| 500 | Database error | Supabase connection issue |

---

## Database Schema

### ai_conversations
```sql
- id: text (primary key)
- session_id: text (foreign key)
- patient_id: text (foreign key)
- title: text
- system_prompt: text
- context: text
- model: text
- temperature: real
- max_tokens: integer
- status: text (active, ended, paused)
- started_at: timestamptz
- ended_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### ai_messages
```sql
- id: text (primary key)
- conversation_id: text (foreign key)
- role: text (user, assistant, system)
- content: text
- tokens_used: integer
- audio_url: text
- created_at: timestamptz
```

---

## Next Steps for Frontend Integration

1. Create a conversation UI component
2. Implement audio recording and playback
3. Add stream support for real-time responses (requires WebSocket upgrade)
4. Build conversation history visualization
5. Add session linking to existing memory sessions

