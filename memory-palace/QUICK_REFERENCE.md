# Memory Palace API - Quick Reference

## Memories
```
GET    /api/memories              # List all
POST   /api/memories              # Create new
GET    /api/memories/:id          # Get one
PUT    /api/memories/:id          # Update
DELETE /api/memories/:id          # Delete
```

## Sessions
```
GET    /api/sessions              # List all
POST   /api/sessions              # Create new
GET    /api/sessions/:id          # Get one
POST   /api/sessions/:id          # Execute action
```

Session actions (in POST body):
- `{ action: "addMessage", role: "user", message: "..." }`
- `{ action: "end" }`
- `{ action: "updateEngagement", engagementScore: 8.5 }`

## World Generation
```
POST   /api/world/generate        # Start generation
GET    /api/world/status/:id      # Check status
```

Generation inputs (in POST body):
- `{ textPrompt: "..." }`
- `{ memoryId: "..." }`
- `{ imageUrl: "..." }`
- `{ localImagePath: "/path/to/image" }`

## Patient & Progress
```
GET    /api/patient               # Patient info
GET    /api/progress              # Statistics
```

## Common Status Codes
- 200 - Success
- 201 - Created
- 202 - Accepted (async)
- 400 - Bad Request
- 404 - Not Found
- 500 - Server Error

## Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
WLT_API_KEY
```

## Key Files
- API Routes: `src/app/api/**/route.ts`
- Database: `src/lib/db.ts`
- Types: `src/types/index.ts`
- Tests: `__tests__/**/*.test.ts`
- Docs: `API_ROUTES.md`, `TESTING.md`

---

For complete details, see:
- 📚 [API_ROUTES.md](./API_ROUTES.md) - Full documentation
- 🧪 [TESTING.md](./TESTING.md) - Testing guide
- 📋 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Architecture overview
