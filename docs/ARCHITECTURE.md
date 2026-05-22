# EventSphere Architecture

University campus event streaming and engagement platform.

## Layers

| Layer | Stack | Location |
|-------|-------|----------|
| Frontend | React 19, TypeScript, Tailwind, Redux Toolkit, RTK Query, React Router, Socket.IO client | `src/` |
| API BFF | Node.js, Express, Socket.IO | `server/` |
| Data | Supabase (PostgreSQL, Auth, Realtime, RLS) | `supabase/migrations/` |

## Actors & routes

- **Admin** — `/admin/*`, platform analytics
- **Organizer** — `/organizer/*`, stream controls
- **Attendee** — `/events`, `/attendee/*`, `/events/:id/stream`
- **Sponsor** — sponsor modules (planned)

RBAC: `src/lib/permissions.ts`, `ProtectedRoute`, `RoleRoute`, Supabase RLS.

## RTK Query APIs

- `eventsApi` — categories, events, live events
- `bookingsApi` — my bookings, access checks
- `chatApi` — messages, send
- `streamsApi` — sessions, playback, start/end
- `aiApi` — recommendations, event insights (feature flag)

## Real-time

- **Chat:** Supabase Realtime on `chat_messages` + optional Socket.IO (`server/src/sockets/chat.ts`)
- **Streams:** `stream_sessions` table + BFF `/api/v1/streams/*`

## AI module

Enabled with `FEATURE_AI=true` / `VITE_FEATURE_AI=true`.

- Recommendations from booking history
- Event insights: attendance forecast, chat sentiment proxy
- Data: `engagement_events`, `ai_insights`

## Running locally

```bash
# Terminal 1 — frontend
npm install && npm run dev

# Terminal 2 — API
cd server && npm install && cp .env.example .env
npm run dev

# Apply DB migration
supabase db push
```

## Deployment

- Frontend: Vercel/Netlify static build (`npm run build`)
- API: container on Railway/Fly/ECS (`server/`)
- Database: Supabase hosted Postgres
- CI: `.github/workflows/ci.yml`

See prior architecture review in project chat for ERD, sequence flows, and security checklist.
