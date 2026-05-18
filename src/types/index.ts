export type UserRole = "admin" | "organizer" | "attendee" | "sponsor";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  phone: string;
  bio: string;
  company: string;
  website: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export type EventStatus = "draft" | "pending" | "published" | "cancelled" | "completed";

export interface Event {
  id: string;
  organizer_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string;
  banner_url: string;
  thumbnail_url: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  is_online: boolean;
  stream_url: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: EventStatus;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined
  organizer?: Profile;
  category?: Category;
  ticket_tiers?: TicketTier[];
}

export interface EventSchedule {
  id: string;
  event_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  location: string;
  type: "session" | "break" | "keynote" | "workshop" | "networking";
  order_index: number;
  created_at: string;
}

export interface Speaker {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  title: string;
  company: string;
  linkedin: string;
  twitter: string;
  website: string;
  created_at: string;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  benefits: string[];
  created_at: string;
}

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "refunded";

export interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  status: BookingStatus;
  total_amount: number;
  currency: string;
  stripe_session_id: string;
  qr_code: string;
  checked_in: boolean;
  checked_in_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined
  event?: Event;
  user?: Profile;
  booking_items?: BookingItem[];
}

export interface BookingItem {
  id: string;
  booking_id: string;
  ticket_tier_id: string;
  quantity: number;
  unit_price: number;
  attendee_name: string;
  attendee_email: string;
  created_at: string;
  ticket_tier?: TicketTier;
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  payment_method: string;
  stripe_payment_intent_id: string;
  created_at: string;
}

export interface Sponsor {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string;
  website: string;
  description: string;
  contact_email: string;
  is_verified: boolean;
  created_at: string;
}

export interface Sponsorship {
  id: string;
  event_id: string;
  sponsor_id: string;
  tier: "platinum" | "gold" | "silver" | "bronze" | "custom";
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed";
  benefits: string[];
  created_at: string;
  event?: Event;
  sponsor?: Sponsor;
}

export interface Advertisement {
  id: string;
  sponsor_id: string;
  event_id: string | null;
  title: string;
  image_url: string;
  click_url: string;
  impressions: number;
  clicks: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  message: string;
  type: "text" | "system" | "question";
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  user?: Profile;
}

export interface Poll {
  id: string;
  event_id: string;
  question: string;
  is_active: boolean;
  is_anonymous: boolean;
  ends_at: string | null;
  created_at: string;
  options?: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  order_index: number;
  votes?: number;
}

export interface Question {
  id: string;
  event_id: string;
  user_id: string;
  question: string;
  is_answered: boolean;
  is_approved: boolean;
  upvotes: number;
  created_at: string;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "booking" | "event";
  is_read: boolean;
  link: string;
  created_at: string;
}
