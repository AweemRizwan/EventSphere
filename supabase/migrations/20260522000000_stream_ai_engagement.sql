/*
  EventSphere: stream sessions, engagement telemetry, AI insights cache
*/

CREATE TABLE IF NOT EXISTS stream_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'custom',
  ingest_url text DEFAULT '',
  playback_url text DEFAULT '',
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'ended', 'failed')),
  started_at timestamptz,
  ended_at timestamptz,
  peak_viewers integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stream_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View stream sessions for accessible events"
  ON stream_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (e.status = 'published' OR e.organizer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );

CREATE POLICY "Organizers can manage stream sessions"
  ON stream_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (e.organizer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );

CREATE POLICY "Organizers can update stream sessions"
  ON stream_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (e.organizer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (e.organizer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );

CREATE TABLE IF NOT EXISTS engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can log own engagement"
  ON engagement_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers and admins view engagement"
  ON engagement_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (e.organizer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    )
  );

CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('user', 'event', 'platform')),
  scope_id uuid,
  insight_type text NOT NULL
    CHECK (insight_type IN ('recommendation', 'sentiment', 'attendance_forecast', 'activity_report')),
  payload jsonb NOT NULL DEFAULT '{}',
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own AI insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (
    (scope = 'user' AND scope_id = auth.uid())
    OR (scope = 'event' AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = scope_id
      AND (e.organizer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
    ))
    OR (scope = 'platform' AND EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    ))
  );

CREATE POLICY "Service inserts AI insights"
  ON ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_stream_sessions_event ON stream_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_status ON stream_sessions(status);
CREATE INDEX IF NOT EXISTS idx_engagement_events_event ON engagement_events(event_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_scope ON ai_insights(scope, scope_id);
