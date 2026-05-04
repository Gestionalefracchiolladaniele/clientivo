-- ============================================================
-- V2.0 TEAM MEMBERS MIGRATION
-- Estende team_users con invite flow + permessi granulari
-- Sicuro da eseguire più volte (idempotente)
-- Esegui nel Supabase SQL Editor → New query → Run
-- ============================================================

-- 1. Estendi team_users con le nuove colonne
alter table team_users add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table team_users add column if not exists status text not null default 'pending' check (status in ('pending', 'active', 'disabled'));
alter table team_users add column if not exists invite_token uuid default gen_random_uuid() unique;
alter table team_users add column if not exists invite_expires_at timestamptz;

-- Permessi granulari (default OFF — dipendente vede solo ciò che l'owner abilita)
alter table team_users add column if not exists can_view_onedigit_dashboard boolean not null default false;
alter table team_users add column if not exists can_view_supplier_costs boolean not null default false;
alter table team_users add column if not exists can_view_storico_contratti boolean not null default false;
alter table team_users add column if not exists can_send_quotes boolean not null default false;

-- Index per lookup veloce su token e user_id
create index if not exists team_users_invite_token_idx on team_users(invite_token);
create index if not exists team_users_user_id_idx on team_users(user_id);
create index if not exists team_users_account_id_idx on team_users(account_id);

-- 2. Aggiorna RLS su team_users
--    Owner vede/gestisce i propri member; employee vede il proprio record
alter table team_users enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'team_users' and policyname = 'owner_full_access'
  ) then
    create policy "owner_full_access" on team_users
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'team_users' and policyname = 'employee_read_own'
  ) then
    create policy "employee_read_own" on team_users
      for select using (user_id = auth.uid());
  end if;
end $$;

-- 3. RLS estesa su tabelle principali
--    Employee autenticato (status=active) vede i dati dell'owner tramite team_users
--    Usiamo una funzione helper per evitare subquery ripetute

create or replace function get_accessible_account_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select auth.uid()
  union
  select account_id from team_users
  where user_id = auth.uid() and status = 'active'
$$;

-- clients
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'clients' and policyname = 'team_access'
  ) then
    create policy "team_access" on clients
      for select using (account_id in (select get_accessible_account_ids()));
  end if;
end $$;

-- quotes
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quotes' and policyname = 'team_access'
  ) then
    create policy "team_access" on quotes
      for select using (account_id in (select get_accessible_account_ids()));
  end if;
end $$;

-- quote_items
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quote_items' and policyname = 'team_access'
  ) then
    create policy "team_access" on quote_items
      for select using (
        quote_id in (
          select id from quotes where account_id in (select get_accessible_account_ids())
        )
      );
  end if;
end $$;

-- template_servizi
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'template_servizi' and policyname = 'team_access'
  ) then
    create policy "team_access" on template_servizi
      for select using (account_id in (select get_accessible_account_ids()));
  end if;
end $$;

-- bundle_progetti
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'bundle_progetti' and policyname = 'team_access'
  ) then
    create policy "team_access" on bundle_progetti
      for select using (account_id in (select get_accessible_account_ids()));
  end if;
end $$;

-- bundle_items (via join su bundle_progetti)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'bundle_items' and policyname = 'team_access'
  ) then
    create policy "team_access" on bundle_items
      for select using (
        bundle_id in (
          select id from bundle_progetti where account_id in (select get_accessible_account_ids())
        )
      );
  end if;
end $$;

-- packages (per QuoteBuilder editor)
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'packages' and policyname = 'team_access'
  ) then
    create policy "team_access" on packages
      for select using (account_id in (select get_accessible_account_ids()));
  end if;
end $$;
