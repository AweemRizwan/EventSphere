/*
  # Seed Data for EventSphere

  ## Overview
  Initial seed data including categories and sample data for development.

  ## Data Added
  1. Categories - 10 event categories
*/

INSERT INTO categories (name, slug, description, icon, color) VALUES
  ('Technology', 'technology', 'Tech conferences, hackathons, and workshops', 'Cpu', '#3B82F6'),
  ('Business', 'business', 'Business summits, networking events, and seminars', 'Briefcase', '#10B981'),
  ('Music', 'music', 'Concerts, festivals, and live performances', 'Music', '#F59E0B'),
  ('Sports', 'sports', 'Sports events, tournaments, and fitness', 'Trophy', '#EF4444'),
  ('Arts & Culture', 'arts-culture', 'Art exhibitions, theater, and cultural events', 'Palette', '#8B5CF6'),
  ('Food & Drink', 'food-drink', 'Food festivals, wine tastings, and culinary events', 'UtensilsCrossed', '#F97316'),
  ('Health & Wellness', 'health-wellness', 'Yoga retreats, health summits, and wellness workshops', 'Heart', '#06B6D4'),
  ('Education', 'education', 'Seminars, workshops, and educational conferences', 'GraduationCap', '#84CC16'),
  ('Networking', 'networking', 'Professional networking and meetup events', 'Users', '#EC4899'),
  ('Entertainment', 'entertainment', 'Comedy shows, film screenings, and entertainment', 'Tv', '#6366F1')
ON CONFLICT (slug) DO NOTHING;
