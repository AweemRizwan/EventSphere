CREATE TABLE IF NOT EXISTS manual_ticket_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  event_title text NOT NULL DEFAULT '',
  ticket_name text NOT NULL DEFAULT '',
  ticket_number text NOT NULL DEFAULT '',
  payment_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  quantity integer NOT NULL DEFAULT 1,
  payment_method text NOT NULL DEFAULT '',
  contact_details text NOT NULL DEFAULT '',
  payment_proof text NOT NULL DEFAULT '',
  receipt_note text DEFAULT '',
  approved_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

ALTER TABLE manual_ticket_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_manual_ticket_requests_user_id
  ON manual_ticket_requests (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manual_ticket_requests_event_id
  ON manual_ticket_requests (event_id, status, created_at DESC);

DROP POLICY IF EXISTS "Users can view own manual ticket requests" ON manual_ticket_requests;
CREATE POLICY "Users can view own manual ticket requests"
  ON manual_ticket_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can create manual ticket requests" ON manual_ticket_requests;
CREATE POLICY "Users can create manual ticket requests"
  ON manual_ticket_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own manual ticket requests" ON manual_ticket_requests;
CREATE POLICY "Users can update their own manual ticket requests"
  ON manual_ticket_requests FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE OR REPLACE FUNCTION set_manual_ticket_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS manual_ticket_requests_updated_at_trigger ON manual_ticket_requests;
CREATE TRIGGER manual_ticket_requests_updated_at_trigger
BEFORE UPDATE ON manual_ticket_requests
FOR EACH ROW
EXECUTE FUNCTION set_manual_ticket_requests_updated_at();
