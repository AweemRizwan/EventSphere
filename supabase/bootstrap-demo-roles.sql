-- Minimal bootstrap for EventSphere demo roles
-- Run this in Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text default '',
  avatar_url text default '',
  role text not null default 'attendee' check (role in ('admin', 'organizer', 'attendee', 'sponsor')),
  phone text default '',
  bio text default '',
  company text default '',
  website text default '',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy if not exists "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy if not exists "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy if not exists "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy if not exists "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Demo users
-- These emails match the app seed script.
insert into public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', 'admin@eventsphere.local', 'Admin User', 'admin', true, now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'organizer@eventsphere.local', 'Organizer User', 'organizer', true, now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'attendee@eventsphere.local', 'Attendee User', 'attendee', true, now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'sponsor@eventsphere.local', 'Sponsor User', 'sponsor', true, now(), now())
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = now();

-- Optional: make sure auth users exist for the seeded emails.
-- If they do not, create them in Supabase Auth first, then rerun this file.
