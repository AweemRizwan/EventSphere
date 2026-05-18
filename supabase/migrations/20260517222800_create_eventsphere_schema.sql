/*
  # EventSphere Complete Database Schema

  ## Overview
  Full schema for the EventSphere Event Management Platform supporting
  Admin, Organizer, Attendee, and Sponsor roles.

  ## Tables Created
  1. profiles - Extended user profiles linked to auth.users
  2. categories - Event categories
  3. events - Core events table
  4. event_schedules - Sessions/agenda within events
  5. speakers - Speaker profiles
  6. event_speakers - Junction table for events and speakers
  7. ticket_tiers - Ticket pricing tiers per event
  8. bookings - Ticket bookings/registrations
  9. booking_items - Individual tickets within a booking
  10. payments - Payment records
  11. sponsors - Sponsor profiles
  12. sponsorships - Sponsorship deals per event
  13. advertisements - Ad campaigns by sponsors
  14. chat_messages - Realtime chat per event
  15. polls - Live polls per event
  16. poll_options - Options within polls
  17. poll_votes - User votes on polls
  18. questions - Q&A questions per event
  19. notifications - User notifications
  20. event_reactions - Emoji reactions per event

  ## Security
  - RLS enabled on all tables
  - Policies enforce proper role-based access
*/

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  role text NOT NULL DEFAULT 'attendee' CHECK (role IN ('admin', 'organizer', 'attendee', 'sponsor')),
  phone text DEFAULT '',
  bio text DEFAULT '',
  company text DEFAULT '',
  website text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  icon text DEFAULT '',
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE,
  description text DEFAULT '',
  banner_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  venue text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT '',
  is_online boolean DEFAULT false,
  stream_url text DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'cancelled', 'completed')),
  is_featured boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  TO authenticated
  USING (status = 'published' OR organizer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = organizer_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin'))
  );

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Event Schedules
CREATE TABLE IF NOT EXISTS event_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  location text DEFAULT '',
  type text DEFAULT 'session' CHECK (type IN ('session', 'break', 'keynote', 'workshop', 'networking')),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedules of published events"
  ON event_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND (status = 'published' OR organizer_id = auth.uid()))
  );

CREATE POLICY "Organizers can manage schedules"
  ON event_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid())
  );

CREATE POLICY "Organizers can update schedules"
  ON event_schedules FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

CREATE POLICY "Organizers can delete schedules"
  ON event_schedules FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

-- Speakers
CREATE TABLE IF NOT EXISTS speakers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  title text DEFAULT '',
  company text DEFAULT '',
  linkedin text DEFAULT '',
  twitter text DEFAULT '',
  website text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view speakers"
  ON speakers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can create speakers"
  ON speakers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin')));

CREATE POLICY "Organizers can update speakers"
  ON speakers FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin')));

CREATE POLICY "Organizers can delete speakers"
  ON speakers FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer', 'admin')));

-- Event Speakers Junction
CREATE TABLE IF NOT EXISTS event_speakers (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  speaker_id uuid REFERENCES speakers(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES event_schedules(id) ON DELETE SET NULL,
  PRIMARY KEY (event_id, speaker_id)
);

ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event speakers"
  ON event_speakers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can manage event speakers"
  ON event_speakers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

CREATE POLICY "Organizers can delete event speakers"
  ON event_speakers FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

-- Ticket Tiers
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price decimal(10,2) DEFAULT 0,
  quantity integer DEFAULT 0,
  sold integer DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  benefits text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ticket tiers"
  ON ticket_tiers FOR SELECT
  TO authenticated
  USING (
    is_active = true OR
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Organizers can create ticket tiers"
  ON ticket_tiers FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

CREATE POLICY "Organizers can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

CREATE POLICY "Organizers can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  total_amount decimal(10,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  stripe_session_id text DEFAULT '',
  qr_code text DEFAULT '',
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'organizer')))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'organizer')));

-- Booking Items
CREATE TABLE IF NOT EXISTS booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  ticket_tier_id uuid NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  unit_price decimal(10,2) DEFAULT 0,
  attendee_name text DEFAULT '',
  attendee_email text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking items"
  ON booking_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM events e JOIN bookings b ON b.event_id = e.id WHERE b.id = booking_id AND e.organizer_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    ))
  );

CREATE POLICY "Users can create booking items"
  ON booking_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid())
  );

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text DEFAULT 'stripe',
  stripe_payment_intent_id text DEFAULT '',
  stripe_charge_id text DEFAULT '',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  logo_url text DEFAULT '',
  website text DEFAULT '',
  description text DEFAULT '',
  contact_email text DEFAULT '',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified sponsors"
  ON sponsors FOR SELECT
  TO authenticated
  USING (is_verified = true OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Sponsors can create profile"
  ON sponsors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sponsors can update own profile"
  ON sponsors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Sponsorships (event-sponsor deals)
CREATE TABLE IF NOT EXISTS sponsorships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  tier text DEFAULT 'bronze' CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze', 'custom')),
  amount decimal(10,2) DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  benefits text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View sponsorships"
  ON sponsorships FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM sponsors WHERE id = sponsor_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Sponsors can create sponsorships"
  ON sponsorships FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM sponsors WHERE id = sponsor_id AND user_id = auth.uid()));

CREATE POLICY "Update sponsorships"
  ON sponsorships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM sponsors WHERE id = sponsor_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sponsors WHERE id = sponsor_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Advertisements
CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  title text NOT NULL,
  image_url text DEFAULT '',
  click_url text DEFAULT '',
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View active ads"
  ON advertisements FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (SELECT 1 FROM sponsors WHERE id = sponsor_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Sponsors can create ads"
  ON advertisements FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM sponsors WHERE id = sponsor_id AND user_id = auth.uid()));

CREATE POLICY "Sponsors can update own ads"
  ON advertisements FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM sponsors WHERE id = sponsor_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM sponsors WHERE id = sponsor_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'system', 'question')),
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendees can view chat"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can send chat"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'organizer')));

-- Polls
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question text NOT NULL,
  is_active boolean DEFAULT true,
  is_anonymous boolean DEFAULT false,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View polls for events"
  ON polls FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can create polls"
  ON polls FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

CREATE POLICY "Organizers can update polls"
  ON polls FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()));

-- Poll Options
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text text NOT NULL,
  order_index integer DEFAULT 0
);

ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View poll options"
  ON poll_options FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can manage poll options"
  ON poll_options FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM polls p JOIN events e ON e.id = p.event_id WHERE p.id = poll_id AND e.organizer_id = auth.uid()));

-- Poll Votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View poll votes"
  ON poll_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote"
  ON poll_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Questions (Q&A)
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  is_answered boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View approved questions"
  ON questions FOR SELECT
  TO authenticated
  USING (is_approved = true OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'organizer')));

CREATE POLICY "Users can submit questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM events WHERE id = event_id AND organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'booking', 'event')),
  is_read boolean DEFAULT false,
  link text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Event Reactions
CREATE TABLE IF NOT EXISTS event_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View reactions"
  ON event_reactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can react"
  ON event_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_event ON chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_questions_event ON questions(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
