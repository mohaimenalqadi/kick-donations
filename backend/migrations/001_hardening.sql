-- =============================================================================
-- Migration 001 — security hardening, dynamic tiers, moderation, stats
-- Run once in the Supabase SQL editor BEFORE deploying the new backend.
-- Idempotent: safe to re-run.
-- =============================================================================

begin;

create table if not exists public.schema_migrations (
    version     text primary key,
    applied_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- users: session revocation
-- -----------------------------------------------------------------------------
alter table public.users add column if not exists token_version integer not null default 0;

-- -----------------------------------------------------------------------------
-- donations: moderation, idempotency, dynamic tiers
-- -----------------------------------------------------------------------------
alter table public.donations add column if not exists flagged boolean not null default false;
alter table public.donations add column if not exists original_message text;
alter table public.donations add column if not exists idempotency_key text;

-- Tiers are configured in tier_settings now; drop the hard-coded CHECK on tier
-- (it did not even allow 'tier_50').
do $$
declare c record;
begin
    for c in
        select conname from pg_constraint
        where conrelid = 'public.donations'::regclass
          and contype = 'c'
          and pg_get_constraintdef(oid) ilike '%tier%'
    loop
        execute format('alter table public.donations drop constraint %I', c.conname);
    end loop;
end $$;

-- Views run with the owner's rights and bypass RLS; this one is unused and
-- would also block the column type change below.
drop view if exists public.recent_donations;
alter table public.donations alter column tier type varchar(30);

create unique index if not exists donations_idempotency_key_uidx
    on public.donations (idempotency_key) where idempotency_key is not null;
create index if not exists donations_status_created_idx on public.donations (status, created_at);
create index if not exists donations_created_by_idx on public.donations (created_by);
create index if not exists donations_live_idx on public.donations (created_at) where status = 'live';
create index if not exists donations_flagged_idx on public.donations (created_at desc) where flagged;

create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);

-- -----------------------------------------------------------------------------
-- tier_settings: optional upper bound (the 50 LYD tier matches exactly 50)
-- -----------------------------------------------------------------------------
create table if not exists public.tier_settings (
    id              uuid primary key default gen_random_uuid(),
    tier_key        varchar(30) unique not null,
    label           varchar(50) not null,
    min_amount      numeric(10,2) not null,
    max_amount      numeric(10,2),
    color           varchar(10) not null default '#03e115',
    duration        integer not null default 10000,
    background_url  text,
    sound_url       text,
    volume          integer not null default 80,
    updated_at      timestamptz not null default now()
);
alter table public.tier_settings add column if not exists max_amount numeric(10,2);
alter table public.tier_settings add column if not exists volume integer not null default 80;

insert into public.tier_settings (tier_key, label, min_amount, max_amount, color, duration) values
    ('tier1',   'بسيط',             1,  null, '#10b981', 10000),
    ('tier2',   'فضي',              5,  null, '#3b82f6', 15000),
    ('tier3',   'ذهبي',             10, null, '#f59e0b', 30000),
    ('tier4',   'بلاتيني',          20, null, '#8b5cf6', 45000),
    ('tier5',   'ملكي',             30, null, '#ef4444', 60000),
    ('tier6',   'أسطوري',           40, null, '#e879f9', 90000),
    ('tier_50', 'الخمسين الخارقة',  50, 50,   '#ff007f', 120000)
on conflict (tier_key) do nothing;

update public.tier_settings set max_amount = min_amount
where tier_key = 'tier_50' and max_amount is null;

-- -----------------------------------------------------------------------------
-- platform_settings: single row + secret overlay key
-- -----------------------------------------------------------------------------
create table if not exists public.platform_settings (
    id            uuid primary key default gen_random_uuid(),
    site_title    text not null default 'KickPay',
    currency      text not null default 'LYD',
    tts_enabled   boolean not null default false,
    tts_voice     text,
    mute_overlay  boolean not null default false,
    updated_at    timestamptz not null default now()
);
alter table public.platform_settings add column if not exists overlay_key text;

insert into public.platform_settings (site_title)
select 'KickPay' where not exists (select 1 from public.platform_settings);

update public.platform_settings
set overlay_key = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where overlay_key is null;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- The backend uses the service-role key, which bypasses RLS. The previous
-- "USING (true)" policies opened every table to the public anon key — remove
-- them and leave RLS enabled with NO policies (deny all for anon/authenticated).
-- -----------------------------------------------------------------------------
drop policy if exists "Service role can do everything on users" on public.users;
drop policy if exists "Service role can do everything on donations" on public.donations;
drop policy if exists "Service role can do everything on activity_logs" on public.activity_logs;

do $$
declare t text; p record;
begin
    foreach t in array array['users','donations','activity_logs','tier_settings','platform_settings','transfer_sessions','schema_migrations']
    loop
        if to_regclass('public.' || t) is not null then
            execute format('alter table public.%I enable row level security', t);
            for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
                execute format('drop policy %I on public.%I', p.policyname, t);
            end loop;
            execute format('revoke all on public.%I from anon, authenticated', t);
        end if;
    end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Functions
-- -----------------------------------------------------------------------------

-- Atomically create the first admin. Returns false if any user already exists.
create or replace function public.create_first_admin(p_username text, p_password_hash text)
returns boolean
language plpgsql
set search_path = public
as $$
begin
    lock table public.users in share row exclusive mode;
    if exists (select 1 from public.users) then
        return false;
    end if;
    insert into public.users (username, password_hash, role) values (p_username, p_password_hash, 'admin');
    return true;
end;
$$;

create or replace function public.stats_summary(p_tz text default 'Africa/Tripoli')
returns table (
    all_time_total numeric,
    all_time_count bigint,
    today_total    numeric,
    today_count    bigint,
    daily_average  numeric
)
language sql
stable
set search_path = public
as $$
    with bounds as (
        select (date_trunc('day', now() at time zone p_tz)) at time zone p_tz as day_start
    )
    select
        coalesce(sum(d.amount), 0),
        count(d.id),
        coalesce(sum(d.amount) filter (where d.created_at >= b.day_start), 0),
        count(d.id) filter (where d.created_at >= b.day_start),
        coalesce(
            round(sum(d.amount) / nullif(count(distinct (d.created_at at time zone p_tz)::date), 0), 2),
            0
        )
    from bounds b
    left join public.donations d on true
    group by b.day_start;
$$;

create or replace function public.stats_daily(p_start timestamptz, p_end timestamptz, p_tz text default 'Africa/Tripoli')
returns table (day date, total numeric, count bigint)
language sql
stable
set search_path = public
as $$
    select (created_at at time zone p_tz)::date as day, sum(amount), count(*)
    from public.donations
    where created_at between p_start and p_end
    group by 1
    order by 1;
$$;

create or replace function public.stats_tier_distribution(p_start timestamptz, p_end timestamptz)
returns table (tier text, count bigint, total numeric)
language sql
stable
set search_path = public
as $$
    select tier::text, count(*), sum(amount)
    from public.donations
    where created_at between p_start and p_end
    group by tier
    order by count(*) desc;
$$;

-- Only the backend (service_role) may call functions.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

-- -----------------------------------------------------------------------------
-- Storage bucket for uploaded overlay media (public read, writes via backend)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'overlay-media', 'overlay-media', true, 31457280,
    array['video/mp4','video/webm','image/gif','image/png','image/jpeg','image/webp','audio/mpeg','audio/wav','audio/ogg','audio/webm']
)
on conflict (id) do nothing;

insert into public.schema_migrations (version) values ('001_hardening') on conflict do nothing;

commit;
