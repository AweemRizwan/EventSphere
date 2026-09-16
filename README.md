# EventSphere

EventSphere is a React/Vite event management frontend with a Node/Express API, Supabase Auth/Postgres, optional Socket.IO chat, and optional Stripe payments.

## Requirements

- Node.js 22 or newer
- A Supabase project with the SQL files in `supabase/migrations/` applied
- A browser-safe Supabase anon/publishable key
- A Supabase service-role key for the API and demo-user seed script

## Clone and run

```powershell
git clone <repository-url>
cd EventSphere
npm ci
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
Set-Location server
npm ci
Set-Location ..
```

Edit `.env` and set:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Edit `server/.env` and set the same project URL and service-role key. Keep service-role keys server-side and never put them in a `VITE_*` variable.

Apply the SQL migrations in Supabase SQL Editor in filename order. Then optionally create demo accounts:

```powershell
npm run seed:demo
```

Start the frontend and API in separate terminals:

```powershell
npm run dev
```

```powershell
npm run dev:server
```

Open http://localhost:5173.

## Verification

```powershell
npm run build
npm run build:server
npm test -- --run
```

Stripe keys are only required for payment/webhook functionality. The AI feature does not require a separate AI API key.
