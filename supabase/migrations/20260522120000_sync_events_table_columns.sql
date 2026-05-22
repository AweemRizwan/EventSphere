-- Deprecated: use 20260522130000_events_complete_schema.sql instead
-- Kept for migration history; adds date columns missing from earlier sync scripts
ALTER TABLE events ADD COLUMN IF NOT EXISTS starts_at timestamptz DEFAULT now();
ALTER TABLE events ADD COLUMN IF NOT EXISTS ends_at timestamptz DEFAULT now();
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id uuid;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE events ADD COLUMN IF NOT EXISTS category_id uuid;
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS thumbnail_url text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS address text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS city text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS country text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS stream_url text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
