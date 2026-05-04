-- ============================================================
-- TEAM V2 MIGRATION
-- Aggiunge: ruoli owner/admin/member, avatar_url, permessi completi
-- per tutte le sezioni OneDigit e QuoteBuilder, RLS enforcement reale.
-- Idempotente: sicuro da rieseguire.
-- ============================================================

-- 1. Nuove colonne su team_users
alter table team_users add column if not exists avatar_url text;

-- Nuovo sistema ruoli (owner | admin | member)
-- Il campo 'role' esiste già ma con valori diversi, lo aggiorniamo
alter table team_users drop constraint if exists team_users_role_check;
alter table team_users alter column role set default 'member';
alter table team_users add constraint team_users_role_check
  check (role in ('owner', 'admin', 'member'));

-- Aggiorna valori legacy al nuovo sistema
update team_users set role = 'admin' where role = 'commerciale' or role = 'project_manager';
update team_users set role = 'member' where role = 'viewer';

-- Nuovi permessi granulari OneDigit
alter table team_users add column if not exists can_view_clients boolean not null default false;
alter table team_users add column if not exists can_view_packages boolean not null default false;
alter table team_users add column if not exists can_view_contracts boolean not null default false;
alter table team_users add column if not exists can_view_commercials boolean not null default false;

-- Nuovi permessi granulari QuoteBuilder
alter table team_users add column if not exists can_view_quotes boolean not null default false;
alter table team_users add column if not exists can_edit_quotes boolean not null default false;
alter table team_users add column if not exists can_view_servizi boolean not null default false;
alter table team_users add column if not exists can_view_bundle boolean not null default false;
alter table team_users add column if not exists can_view_impostazioni boolean not null default false;

-- 2. Aggiorna trigger handle_new_user per salvare avatar_url in team_users
--    quando l'employee accetta l'invito (già gestito via acceptInvite action)

-- 3. Funzione helper aggiornata che verifica ruolo per RLS
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

-- Funzione che restituisce il team_user record del current user
create or replace function get_my_team_user(p_account_id uuid)
returns table(
  id uuid,
  role text,
  status text,
  can_view_onedigit_dashboard boolean,
  can_view_supplier_costs boolean,
  can_view_storico_contratti boolean,
  can_send_quotes boolean,
  can_view_clients boolean,
  can_view_packages boolean,
  can_view_contracts boolean,
  can_view_commercials boolean,
  can_view_quotes boolean,
  can_edit_quotes boolean,
  can_view_servizi boolean,
  can_view_bundle boolean,
  can_view_impostazioni boolean
)
language sql
security definer
stable
as $$
  select
    id, role, status,
    can_view_onedigit_dashboard, can_view_supplier_costs,
    can_view_storico_contratti, can_send_quotes,
    can_view_clients, can_view_packages, can_view_contracts,
    can_view_commercials, can_view_quotes, can_edit_quotes,
    can_view_servizi, can_view_bundle, can_view_impostazioni
  from team_users
  where user_id = auth.uid()
    and account_id = p_account_id
    and status = 'active'
  limit 1
$$;

-- 4. RLS su team_users: admin può modificare permessi di member (non owner)
--    Elimina policy esistenti e ricrea

drop policy if exists "owner_full_access" on team_users;
drop policy if exists "employee_read_own" on team_users;
drop policy if exists "admin_manage_members" on team_users;

-- Owner: accesso completo ai propri team_users
create policy "owner_full_access" on team_users
  for all
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- Employee: può leggere il proprio record
create policy "employee_read_own" on team_users
  for select
  using (user_id = auth.uid());

-- Admin: può leggere e modificare permessi dei member (non owner) dello stesso account
create policy "admin_manage_members" on team_users
  for all
  using (
    account_id in (
      select tu.account_id from team_users tu
      where tu.user_id = auth.uid()
        and tu.status = 'active'
        and tu.role = 'admin'
    )
    and role != 'owner'
  )
  with check (
    account_id in (
      select tu.account_id from team_users tu
      where tu.user_id = auth.uid()
        and tu.status = 'active'
        and tu.role = 'admin'
    )
    and role != 'owner'
  );

-- 5. RLS enforcement reale sui dati: ogni tabella verifica il permesso specifico

-- CLIENTS: solo chi ha can_view_clients (o è owner)
drop policy if exists "team_access" on clients;
create policy "team_access" on clients
  for select using (
    account_id = auth.uid()
    or account_id in (
      select account_id from team_users
      where user_id = auth.uid()
        and status = 'active'
        and (role = 'admin' or can_view_clients = true)
    )
  );

-- PACKAGES: solo chi ha can_view_packages (o è owner/admin)
drop policy if exists "team_access" on packages;
create policy "team_access" on packages
  for select using (
    account_id = auth.uid()
    or account_id in (
      select account_id from team_users
      where user_id = auth.uid()
        and status = 'active'
        and (role = 'admin' or can_view_packages = true)
    )
  );

-- CONTRACTS: solo chi ha can_view_contracts (o è owner/admin)
drop policy if exists "team_access" on contracts;
create policy "team_access" on contracts
  for select using (
    account_id = auth.uid()
    or account_id in (
      select account_id from team_users
      where user_id = auth.uid()
        and status = 'active'
        and (role = 'admin' or can_view_contracts = true)
    )
  );

-- COMMERCIALS: solo chi ha can_view_commercials (o è owner/admin)
drop policy if exists "team_access" on commercials;
create policy "team_access" on commercials
  for select using (
    account_id = auth.uid()
    or account_id in (
      select account_id from team_users
      where user_id = auth.uid()
        and status = 'active'
        and (role = 'admin' or can_view_commercials = true)
    )
  );

-- SUPPLIER_PRICE_LIST: solo chi ha can_view_supplier_costs (o è owner/admin)
drop policy if exists "team_access" on supplier_price_list;
create policy "team_access" on supplier_price_list
  for select using (
    account_id = auth.uid()
    or account_id in (
      select account_id from team_users
      where user_id = auth.uid()
        and status = 'active'
        and (role = 'admin' or can_view_supplier_costs = true)
    )
  );

-- QUOTES: solo chi ha can_view_quotes (o è owner/admin)
drop policy if exists "team_access" on quotes;
create policy "team_access" on quotes
  for select using (
    account_id = auth.uid()
    or account_id in (
      select account_id from team_users
      where user_id = auth.uid()
        and status = 'active'
        and (role = 'admin' or can_view_quotes = true)
    )
  );

-- QUOTE_ITEMS: segue quotes
drop policy if exists "team_access" on quote_items;
create policy "team_access" on quote_items
  for select using (
    quote_id in (
      select id from quotes where account_id in (select get_accessible_account_ids())
    )
  );

-- TEMPLATE_SERVIZI: solo chi ha can_view_servizi (o è owner/admin)
drop policy if exists "team_access" on template_servizi;
create policy "team_access" on template_servizi
  for select using (
    account_id = auth.uid()
    or account_id in (
      select account_id from team_users
      where user_id = auth.uid()
        and status = 'active'
        and (role = 'admin' or can_view_servizi = true)
    )
  );

-- BUNDLE_PROGETTI: solo chi ha can_view_bundle (o è owner/admin)
drop policy if exists "team_access" on bundle_progetti;
create policy "team_access" on bundle_progetti
  for select using (
    account_id = auth.uid()
    or account_id in (
      select account_id from team_users
      where user_id = auth.uid()
        and status = 'active'
        and (role = 'admin' or can_view_bundle = true)
    )
  );

-- BUNDLE_ITEMS: segue bundle_progetti
drop policy if exists "team_access" on bundle_items;
create policy "team_access" on bundle_items
  for select using (
    bundle_id in (
      select id from bundle_progetti where account_id in (select get_accessible_account_ids())
    )
  );

-- 6. Crea un record "owner" fittizio in team_users per ogni account esistente
--    così l'owner appare nella lista team con ruolo owner.
--    Usa upsert su email per evitare duplicati.
insert into team_users (account_id, name, email, role, status, is_active)
select
  a.id as account_id,
  coalesce(a.full_name, a.email) as name,
  a.email,
  'owner' as role,
  'active' as status,
  true as is_active
from accounts a
where not exists (
  select 1 from team_users tu
  where tu.account_id = a.id and tu.role = 'owner'
)
on conflict do nothing;
