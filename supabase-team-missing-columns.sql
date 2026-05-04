-- ============================================================
-- TEAM MISSING COLUMNS FIX (v3 — robusta)
-- Eseguire nel SQL Editor di Supabase.
-- ============================================================

-- 1. Rimuovi il constraint PRIMA di fare qualsiasi update
alter table team_users drop constraint if exists team_users_role_check;

-- 2. Normalizza tutti i valori legacy
update team_users set role = 'admin'  where role in ('commerciale', 'project_manager');
update team_users set role = 'member' where role not in ('owner', 'admin', 'member');

-- 3. Aggiungi colonne mancanti
-- can_view_onedigit_dashboard: default false (bloccata di default per nuovi membri)
-- tutte le altre: default true (libere di default per nuovi membri)
alter table team_users add column if not exists can_view_onedigit_dashboard boolean not null default false;
alter table team_users add column if not exists can_view_clients            boolean not null default true;
alter table team_users add column if not exists can_view_packages           boolean not null default true;
alter table team_users add column if not exists can_view_contracts          boolean not null default true;
alter table team_users add column if not exists can_view_commercials        boolean not null default true;
alter table team_users add column if not exists can_view_supplier_costs     boolean not null default true;
alter table team_users add column if not exists can_view_storico_contratti  boolean not null default true;
alter table team_users add column if not exists can_view_quotes             boolean not null default true;
alter table team_users add column if not exists can_edit_quotes             boolean not null default true;
alter table team_users add column if not exists can_view_servizi            boolean not null default true;
alter table team_users add column if not exists can_view_bundle             boolean not null default true;
alter table team_users add column if not exists can_send_quotes             boolean not null default true;
alter table team_users add column if not exists can_view_impostazioni       boolean not null default true;
alter table team_users add column if not exists avatar_url                  text;

-- Aggiorna record member esistenti: tutto true tranne dashboard
update team_users
set
  can_view_clients           = true,
  can_view_packages          = true,
  can_view_contracts         = true,
  can_view_commercials       = true,
  can_view_supplier_costs    = true,
  can_view_storico_contratti = true,
  can_view_quotes            = true,
  can_edit_quotes            = true,
  can_view_servizi           = true,
  can_view_bundle            = true,
  can_send_quotes            = true,
  can_view_impostazioni      = true,
  can_view_onedigit_dashboard = false
where role = 'member';

-- 4. Rimetti il constraint DOPO aver normalizzato i dati
alter table team_users alter column role set default 'member';
alter table team_users add constraint team_users_role_check
  check (role in ('owner', 'admin', 'member'));

-- 5. Inserisce record owner per ogni account che non ne ha ancora uno
--    Usa INSERT ... WHERE NOT EXISTS per evitare duplicati
insert into team_users (account_id, name, email, role, status, is_active)
select
  a.id,
  coalesce(a.full_name, a.email),
  a.email,
  'owner',
  'active',
  true
from accounts a
where not exists (
  select 1 from team_users tu
  where tu.account_id = a.id and tu.role = 'owner'
);

-- 6. RLS policies
drop policy if exists "owner_full_access"   on team_users;
drop policy if exists "employee_read_own"   on team_users;
drop policy if exists "admin_manage_members" on team_users;

create policy "owner_full_access" on team_users
  for all
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create policy "employee_read_own" on team_users
  for select
  using (user_id = auth.uid());
