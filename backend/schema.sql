-- =============================================================================
-- Kick Donation Platform — base schema (fresh installs)
--
-- 1. Run this file in the Supabase SQL editor.
-- 2. Then run every file in backend/migrations/ in order (001, 002, ...).
--
-- Existing installations: skip this file and only run the migrations.
-- =============================================================================

create table if not exists public.users (
    id            uuid primary key default gen_random_uuid(),
    username      varchar(50) unique not null,
    password_hash varchar(255) not null,
    role          varchar(20) not null default 'moderator' check (role in ('admin', 'moderator')),
    created_at    timestamptz not null default now()
);

create table if not exists public.donations (
    id            uuid primary key default gen_random_uuid(),
    donor_name    varchar(100) not null,
    amount        numeric(10,2) not null check (amount > 0 and amount <= 10000),
    message       text not null default '',
    tier          varchar(30) not null,
    status        varchar(20) not null default 'pending' check (status in ('pending', 'live', 'done')),
    created_by    uuid references public.users(id) on delete set null,
    created_at    timestamptz not null default now(),
    displayed_at  timestamptz
);

create table if not exists public.activity_logs (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references public.users(id) on delete set null,
    action      varchar(50) not null,
    details     jsonb not null default '{}',
    created_at  timestamptz not null default now()
);

-- Reserved for SMS/transfer matching (not used by the app yet).
create table if not exists public.transfer_sessions (
    id          bigint generated always as identity primary key,
    donor_phone varchar(20) not null,
    amount      numeric(10,2) not null,
    created_at  timestamptz not null default now()
);

create index if not exists idx_donations_status  on public.donations (status);
create index if not exists idx_donations_created on public.donations (created_at desc);
create index if not exists idx_donations_tier    on public.donations (tier);
create index if not exists idx_logs_user         on public.activity_logs (user_id);
create index if not exists idx_logs_action       on public.activity_logs (action);

-- RLS on, no policies: only the backend's service-role key can access data.
alter table public.users             enable row level security;
alter table public.donations         enable row level security;
alter table public.activity_logs     enable row level security;
alter table public.transfer_sessions enable row level security;
