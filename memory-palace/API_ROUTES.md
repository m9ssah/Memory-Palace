# Memory Palace API Routes & Tests

This document describes all the API routes developed for the Memory Palace application and how to test them.

## Setup

### Environment Variables

Create a `.env.local` file in the `memory-palace` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
WLT_API_KEY=your_world_labs_api_key
```

## API Endpoints

### Memories API

#### GET /api/memories
Retrieve all memories for the patient.

**Response:**
```json
[
  {
    "id": "mem-123",
    "title": "Summer Vacation",
    "description": "A wonderful trip to the beach",
    "imageUrl": "https://example.com/beach.jpg",
    "imagePath": "/tmp/beach.jpg",
    "worldId": 1,
    "tags": "vacation,beach,summer",
    "createdAt": "2026-03-01T10:00:00Z",
    "updatedAt": "2026-03-01T10:00:00Z",
    "apiWorldId": "world-123",
    "marbleUrl": "https://example.com/marble.glb"
  }
]
```

#### POST /api/memories
Create a new memory.

**Request Body:**
```json
{
  "title": "Beach Day",
  "description": "Summer trip to the coast",
  "imageUrl": "https://example.com/beach.jpg",
  "imagePath": "/local/path/image.jpg",
  "tags": "vacation,beach"
}
```

**Response:** (201 Created)
```json
{
  "id": "mem-456",
  "title": "Beach Day",
  "description": "Summer trip to the coast",
  "imageUrl": "https://example.com/beach.jpg",
  "imagePath": "/local/path/image.jpg",
  "tags": "vacation,beach"
}
```

#### GET /api/memories/[memoryId]
Retrieve a specific memory by ID.

**Response:** (200 OK)
```json
{
  "id": "mem-123",
  "title": "Summer Vacation",
  "description": "A wonderful trip to the beach",
  "imageUrl": "https://example.com/beach.jpg",
  "worldId": 1,
  "createdAt": "2026-03-01T10:00:00Z",
  "updatedAt": "2026-03-01T10:00:00Z"
}
```

#### PUT /api/memories/[memoryId]
Update an existing memory.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": "new,tags"
}
```

**Response:** (200 OK) - Updated memory object

#### DELETE /api/memories/[memoryId]
Delete a memory.

**Response:** (200 OK)
```json
{
  "success": true
}
```

---

### Sessions API

#### GET /api/sessions
Retrieve all sessions.

**Response:** (200 OK)
```json
[
  {
    "id": "session-123",
    "memoryId": "mem-123",
    "memoryTitle": "Summer Vacation",
    "worldId": 1,
    "startedAt": "2026-03-10T14:30:00Z",
    "endedAt": "2026-03-10T15:00:00Z",
    "durationMinutes": 30,
    "engagementScore": 8.5,
    "conversationLog": [
      {
        "timestamp": "2026-03-10T14:30:00Z",
        "role": "user",
        "content": "Tell me about this beach"
      }
    ],
    "notes": "Patient was very engaged"
  }
]
```

#### POST /api/sessions
Create a new session for a memory.

**Request Body:**
```json
{
  "memoryId": "mem-123",
  "worldId": 1
}
```

**Response:** (201 Created)
```json
{
  "sessionId": "session-456",
  "memoryId": "mem-123",
  "worldId": 1
}
```

#### GET /api/sessions/[sessionId]
Retrieve a specific session.

**Response:** (200 OK) - Session object

#### POST /api/sessions/[sessionId]
Perform actions on a session.

**Request Body - Add Message:**
```json
{
  "action": "addMessage",
  "role": "user",
  "message": "What is this place?"
}
```

**Request Body - End Session:**
```json
{
  "action": "end"
}
```

**Request Body - Update Engagement:**
```json
{
  "action": "updateEngagement",
  "engagementScore": 8.5,
  "notes": "Patient was very engaged"
}
```

**Response:** (200 OK) - Updated session object

---

### World Generation API

#### POST /api/world/generate
Start generating a 3D world from a memory, text prompt, or image.

**Request Body - From Text Prompt:**
```json
{
  "textPrompt": "A beautiful beach with palm trees"
}
```

**Request Body - From Memory:**
```json
{
  "memoryId": "mem-123",
  "model": "Marble 0.1-mini"
}
```

**Request Body - From Image URL:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "model": "Marble 0.1-mini"
}
```

**Request Body - From Local Image:**
```json
{
  "localImagePath": "/local/path/image.jpg",
  "model": "Marble 0.1-mini"
}
```

**Response:** (202 Accepted)
```json
{
  "operationId": "op-123",
  "status": "pending",
  "memoryId": "mem-123"
}
```

#### GET /api/world/status/[generationId]
Check the status of a world generation operation.

**Response - Pending:** (200 OK)
```json
{
  "operationId": "op-123",
  "status": "pending"
}
```

**Response - Complete:** (200 OK)
```json
{
  "operationId": "op-123",
  "status": "ready",
  "worldData": {
    "worldId": "world-123",
    "marbleUrl": "https://example.com/marble.glb",
    "caption": "Generated beach world",
    "splats": {
      "default": "https://example.com/splats.spz"
    },
    "meshUrl": "https://example.com/mesh.gltf",
    "panoramaUrl": "https://example.com/pano.jpg",
    "thumbnailUrl": "https://example.com/thumb.jpg"
  },
  "worldId": 1
}
```

**Response - Failed:** (200 OK)
```json
{
  "operationId": "op-125",
  "status": "failed",
  "error": "Generation failed due to API error"
}
```

---

### Patient API

#### GET /api/patient?id=default
Retrieve patient information.

**Response:** (200 OK)
```json
{
  "id": "default",
  "name": "Patient",
  "age": 75,
  "condition": "Early-stage dementia",
  "notes": "",
  "photoUrl": null,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

---

### Progress API

#### GET /api/progress
Retrieve patient progress statistics.

**Response:** (200 OK)
```json
{
  "totalSessions": 15,
  "totalMemories": 8,
  "avgSessionDuration": 32.5,
  "avgEngagementScore": 7.8,
  "sessionsThisWeek": 3,
  "recentSessions": [
    {
      "id": "session-123",
      "memoryId": "mem-123",
      "startedAt": "2026-03-10T14:30:00Z",
      "durationMinutes": 30,
      "engagementScore": 8.5
    }
  ],
  "engagementOverTime": [
    {
      "date": "2026-03-10",
      "score": 8.5
    },
    {
      "date": "2026-03-09",
      "score": 7.2
    }
  ]
}
```

---

## Testing Examples

### Using cURL

#### Create a memory
```bash
curl -X POST http://localhost:3000/api/memories \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Beach Day",
    "description": "Summer vacation",
    "imageUrl": "https://example.com/beach.jpg",
    "tags": "vacation,beach"
  }'
```

#### Create a session
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "memoryId": "mem-123"
  }'
```

#### Generate a world
```bash
curl -X POST http://localhost:3000/api/world/generate \
  -H "Content-Type: application/json" \
  -d '{
    "textPrompt": "A beautiful beach with palm trees"
  }'
```

#### Check generation status
```bash
curl http://localhost:3000/api/world/status/op-123
```

#### Add a message to session
```bash
curl -X POST http://localhost:3000/api/sessions/session-123 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addMessage",
    "role": "user",
    "message": "Tell me about this memory"
  }'
```

#### Update engagement
```bash
curl -X POST http://localhost:3000/api/sessions/session-123 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateEngagement",
    "engagementScore": 8.5,
    "notes": "Patient was very engaged"
  }'
```

---

## Test Coverage

The test suite covers:

- **Memories API** (`__tests__/api/memories.test.ts`)
  - GET all memories
  - POST create memory
  - GET single memory
  - PUT update memory
  - DELETE memory
  - Error handling

- **Sessions API** (`__tests__/api/sessions.test.ts`)
  - GET all sessions
  - POST create session
  - GET single session
  - POST session actions (addMessage, end, updateEngagement)
  - Error handling

- **World Generation API** (`__tests__/api/world.test.ts`)
  - POST generate world (text, memory, image URL, local image)
  - GET generation status (pending, complete, failed)
  - Error handling (API errors, polling failures)

- **Patient & Progress API** (`__tests__/api/patient-progress.test.ts`)
  - GET patient information
  - GET progress statistics
  - Engagement calculations
  - Error handling

- **Integration Tests** (`__tests__/integration.test.ts`)
  - Complete workflow: create memory → start session → generate world → add messages → track engagement
  - Tests the full interaction between endpoints

---

## Error Handling

All endpoints include comprehensive error handling:

- **400 Bad Request**: Missing or invalid required fields
- **404 Not Found**: Resource does not exist
- **500 Internal Server Error**: Database or API errors

Example error response:
```json
{
  "error": "Failed to create memory"
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- IDs are generated using UUIDs
- World generation is asynchronous - use the GET status endpoint to poll for completion
- World Labs API key must be set in environment variables for world generation
- In draft mode, only text and image-based generation are supported
