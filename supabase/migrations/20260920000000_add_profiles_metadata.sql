ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
