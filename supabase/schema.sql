-- ArsCheck — Supabase PostgreSQL schema
-- Run in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

drop table if exists public.visitors cascade;
drop table if exists public.tours cascade;
drop table if exists public.exhibitions cascade;

create table public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create table public.tours (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null references public.exhibitions(id) on delete cascade,
  title text not null,
  tour_guide text not null,
  start_time timestamptz not null,
  max_capacity integer not null check (max_capacity > 0),
  created_at timestamptz not null default now()
);

create table public.visitors (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  full_name text not null,
  email text not null,
  ticket_type text not null default 'General' check (ticket_type in ('General','VIP','Member')),
  tour_id uuid not null references public.tours(id) on delete restrict,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);

create index visitors_ticket_code_idx on public.visitors(ticket_code);
create index visitors_tour_id_idx on public.visitors(tour_id);
create index visitors_checked_in_at_idx on public.visitors(checked_in_at desc);

alter table public.exhibitions enable row level security;
alter table public.tours enable row level security;
alter table public.visitors enable row level security;

-- Demo-friendly read policies. For production, scope SELECT to authenticated staff roles.
create policy "public read exhibitions" on public.exhibitions for select to anon, authenticated using (true);
create policy "public read tours" on public.tours for select to anon, authenticated using (true);
create policy "public read visitors" on public.visitors for select to anon, authenticated using (true);

-- Writes happen through server-side API routes using SUPABASE_SERVICE_ROLE_KEY.

-- Realtime: required for the live dashboard subscription in the client.
alter publication supabase_realtime add table public.visitors;

-- Seed data
with ex as (
  insert into public.exhibitions (title, start_time, end_time, capacity)
  values
    ('Light, Line & Atmosphere', now() - interval '45 minutes', now() + interval '8 hours', 140),
    ('The Quiet Object', now() + interval '3 days', now() + interval '10 days', 90)
  returning id
), tours as (
  insert into public.tours (exhibition_id, title, tour_guide, start_time, max_capacity)
  select id, title, guide, slot, cap
  from (
    select (select id from ex limit 1) id, 'Impressionism Gallery' title, 'Maya Chen' guide, now() + interval '25 minutes' slot, 24 cap
    union all select (select id from ex limit 1), 'Modern Sculptures', 'Noah Silva', now() + interval '2 hours', 18
    union all select (select id from ex limit 1), 'Curator Highlights', 'Ari Menon', now() + interval '4 hours', 30
    union all select (select id from ex limit 1), 'After Hours — New Works', 'Leah Wong', now() + interval '7 hours', 20
  ) s
  returning id, title
)
insert into public.visitors (ticket_code, full_name, email, ticket_type, tour_id, checked_in, checked_in_at)
select * from (values
  ('ARS-0001','Amelia Hart','amelia@example.com','VIP',(select id from tours where title='Impressionism Gallery' limit 1),true,now()-interval '6 minutes'),
  ('ARS-0002','Daniel Perera','daniel@example.com','General',(select id from tours where title='Impressionism Gallery' limit 1),true,now()-interval '11 minutes'),
  ('ARS-0003','Sofia Malik','sofia@example.com','Member',(select id from tours where title='Modern Sculptures' limit 1),false,null),
  ('ARS-0004','Liam Fernando','liam@example.com','General',(select id from tours where title='Modern Sculptures' limit 1),false,null),
  ('ARS-0005','Nina Kapoor','nina@example.com','General',(select id from tours where title='Curator Highlights' limit 1),true,now()-interval '22 minutes'),
  ('ARS-0006','Theo Martins','theo@example.com','VIP',(select id from tours where title='Curator Highlights' limit 1),false,null),
  ('ARS-0007','Mira Sen','mira@example.com','Member',(select id from tours where title='After Hours — New Works' limit 1),true,now()-interval '35 minutes'),
  ('ARS-0008','Jon Bell','jon@example.com','General',(select id from tours where title='After Hours — New Works' limit 1),false,null)
) v(ticket_code,full_name,email,ticket_type,tour_id,checked_in,checked_in_at);
