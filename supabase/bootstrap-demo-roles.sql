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
  metadata jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view all profiles" on public.profiles;
create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Service role can insert profiles" on public.profiles;
create policy "Service role can insert profiles"
  on public.profiles for insert
  to service_role
  with check (true);

-- Demo users
-- These emails must already exist in auth.users before profile rows are created.
insert into public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
select
  u.id,
  u.email,
  case u.email
    when 'admin@eventsphere.local' then 'Admin User'
    when 'organizer@eventsphere.local' then 'Organizer User'
    when 'attendee@eventsphere.local' then 'Attendee User'
    when 'sponsor@eventsphere.local' then 'Sponsor User'
    else u.email
  end as full_name,
  case u.email
    when 'admin@eventsphere.local' then 'admin'
    when 'organizer@eventsphere.local' then 'organizer'
    when 'attendee@eventsphere.local' then 'attendee'
    when 'sponsor@eventsphere.local' then 'sponsor'
    else 'attendee'
  end as role,
  true,
  now(),
  now()
from auth.users u
where u.email = any (array[
  'admin@eventsphere.local',
  'organizer@eventsphere.local',
  'attendee@eventsphere.local',
  'sponsor@eventsphere.local'
])
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = now();

-- If these auth users do not exist yet, create them in Supabase Auth first,
-- then rerun this script. The insert above will skip missing users instead of failing.
