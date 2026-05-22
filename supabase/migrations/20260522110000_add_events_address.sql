-- events may have been created before address (and related location cols) were added
ALTER TABLE events ADD COLUMN IF NOT EXISTS address text DEFAULT '';
