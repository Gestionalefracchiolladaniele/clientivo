-- ============================================================
-- V2.0 MIGRATION: Client Portal + Token system
-- Sicuro da eseguire più volte (idempotente)
-- Esegui nel Supabase SQL Editor → New query → Run
-- ============================================================

-- ============================================================
-- 1. QUOTE_PUBLIC_TOKENS
-- Token monouso per condivisione preventivo col cliente
-- ============================================================
create table if not exists quote_public_tokens (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  token uuid default gen_random_uuid() not null unique,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  is_active boolean not null default true
);

alter table quote_public_tokens enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'quote_public_tokens' and policyname = 'owner_access'
  ) then
    create policy "owner_access" on quote_public_tokens
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- 2. NOTIFICATIONS
-- Notifiche per owner quando cliente accetta/rifiuta
-- ============================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id) on delete cascade not null,
  quote_id uuid references quotes(id) on delete cascade,
  client_name text not null,
  quote_number text,
  action text not null check (action in ('accepted', 'rejected')),
  is_read boolean not null default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications' and policyname = 'owner_access'
  ) then
    create policy "owner_access" on notifications
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;
