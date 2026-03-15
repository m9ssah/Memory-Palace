# Conversational AI - Quick Start

## Setup

1. **Add OpenAI key to `.env.local`:**
   ```
   OPENAI_API_KEY=sk-...your-key-here...
   ```

2. **Run database migration:**
   ```bash
   npx supabase migration up
   ```

## API Quick Reference

### Start a Conversation
```bash
# Without memory context
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Memory Session",
    "systemPrompt": "You are a compassionate memory assistant.",
    "patientId": "default"
  }'

# With sessionId (auto-loads memory annotation!)
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Memory Session",
    "systemPrompt": "You are a compassionate memory assistant.",
    "sessionId": "your-session-id",
    "patientId": "default"
  }'
```

### Send a Message
```bash
curl -X POST http://localhost:3000/api/conversations/[conversationId]/messages \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Tell me about your childhood"}'
```

### Transcribe Audio
```bash
curl -X POST http://localhost:3000/api/conversations/[conversationId]/transcribe \
  -F "audio=@audio.wav"
```

### Generate Speech
```bash
curl -X POST http://localhost:3000/api/conversations/[conversationId]/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Your response text","voice":"nova"}' \
  -o response.mp3
```

### Get Full Conversation
```bash
curl http://localhost:3000/api/conversations/[conversationId]
```

### End Conversation
```bash
curl -X PATCH http://localhost:3000/api/conversations/[conversationId] \
  -H "Content-Type: application/json" \
  -d '{"status":"ended"}'
```

## Voice Options
- alloy, echo, fable, onyx, nova (default), shimmer

## Key Files
- **Service:** `src/lib/conversation-agent.ts` - OpenAI interactions
- **Routes:** `src/app/api/conversations/` - API endpoints
- **Types:** `src/types/index.ts` - TypeScript interfaces
- **Full Docs:** `CONVERSATION_AI_GUIDE.md`

## Features Implemented
✅ Text conversations with context  
✅ Audio transcription (Whisper)  
✅ Speech synthesis (TTS)  
✅ Conversation history  
✅ Message storage in database  
✅ Patient/session linking  
✅ **Auto-load memory annotations from sessions**  
✅ Configurable AI model & parameters

