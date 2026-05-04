-- ============================================================
-- FIX SCHEMA: crea/aggiorna tutte le tabelle
-- Esegui tutto nel Supabase SQL Editor → New query → Run
-- Sicuro da eseguire più volte (idempotente)
-- ============================================================

-- 1. ACCOUNTS
create table if not exists accounts (
  id uuid primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table accounts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='accounts' and policyname='account_isolation') then
    create policy "account_isolation" on accounts
      for all using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end $$;

-- ============================================================
-- CLIENTS
-- ============================================================

-- Se account_id su clients è text, convertila a uuid
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'clients'
      and column_name = 'account_id'
      and data_type = 'text'
  ) then
    alter table clients drop column account_id;
  end if;
end $$;

alter table clients add column if not exists account_id uuid references accounts(id) on delete cascade;
alter table clients enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='clients' and policyname='account_isolation') then
    create policy "account_isolation" on clients
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- PACKAGES
-- ============================================================
create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration_months int,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table packages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='packages' and policyname='account_isolation') then
    create policy "account_isolation" on packages
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- CONTRACTS
-- ============================================================
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  title text not null,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled', 'draft')),
  start_date date not null,
  end_date date,
  total_value numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table contracts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='contracts' and policyname='account_isolation') then
    create policy "account_isolation" on contracts
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- CONTRACT ITEMS
-- ============================================================
create table if not exists contract_items (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  package_id uuid references packages(id) on delete set null,
  description text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null default 0,
  total_price numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz default now()
);

alter table contract_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='contract_items' and policyname='account_isolation') then
    create policy "account_isolation" on contract_items
      for all using (
        exists (
          select 1 from contracts c
          where c.id = contract_items.contract_id
            and c.account_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from contracts c
          where c.id = contract_items.contract_id
            and c.account_id = auth.uid()
        )
      );
  end if;
end $$;

-- ============================================================
-- TEAM USERS
-- ============================================================
create table if not exists team_users (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'viewer' check (role in ('admin', 'commerciale', 'project_manager', 'viewer')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table team_users enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='team_users' and policyname='account_isolation') then
    create policy "account_isolation" on team_users
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- PROJECTS — converti account_id da text a uuid se necessario
-- ============================================================

-- Drop FK e colonna se è text
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'projects'
      and column_name = 'account_id'
      and data_type = 'text'
  ) then
    alter table projects drop column account_id;
  end if;
end $$;

alter table projects add column if not exists account_id uuid references accounts(id) on delete cascade;
alter table projects enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='projects' and policyname='account_isolation') then
    create policy "account_isolation" on projects
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- SUPPLIER COSTS — converti account_id da text a uuid se necessario
-- ============================================================

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'supplier_costs'
      and column_name = 'account_id'
      and data_type = 'text'
  ) then
    alter table supplier_costs drop column account_id;
  end if;
end $$;

alter table supplier_costs add column if not exists account_id uuid references accounts(id) on delete cascade;
alter table supplier_costs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='supplier_costs' and policyname='account_isolation') then
    create policy "account_isolation" on supplier_costs
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- MONTHLY ENTRIES
-- ============================================================
create table if not exists monthly_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  month date not null,
  revenue numeric(10,2) default 0,
  costs numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, month)
);

alter table monthly_entries enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='monthly_entries' and policyname='account_isolation') then
    create policy "account_isolation" on monthly_entries
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- SHOOTINGS
-- ============================================================
create table if not exists shootings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  date date not null,
  hours numeric(5,2) not null default 0,
  rate_per_hour numeric(10,2) default 0,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table shootings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='shootings' and policyname='account_isolation') then
    create policy "account_isolation" on shootings
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- QUOTE TEMPLATES (prima di quotes per la FK)
-- ============================================================
create table if not exists quote_templates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  html_content text not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table quote_templates enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='quote_templates' and policyname='account_isolation') then
    create policy "account_isolation" on quote_templates
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- QUOTES
-- ============================================================
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  template_id uuid references quote_templates(id) on delete set null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  valid_until date,
  notes text,
  total_amount numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table quotes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='quotes' and policyname='account_isolation') then
    create policy "account_isolation" on quotes
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- QUOTE ITEMS
-- ============================================================
create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  description text not null,
  quantity int not null default 1,
  unit_price numeric(10,2) not null default 0,
  total_price numeric(10,2) generated always as (quantity * unit_price) stored,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table quote_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='quote_items' and policyname='account_isolation') then
    create policy "account_isolation" on quote_items
      for all using (
        exists (
          select 1 from quotes q
          where q.id = quote_items.quote_id
            and q.account_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from quotes q
          where q.id = quote_items.quote_id
            and q.account_id = auth.uid()
        )
      );
  end if;
end $$;

-- ============================================================
-- TRIGGER: auto-crea record in accounts al primo login OAuth
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.accounts (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, accounts.full_name),
        avatar_url = coalesce(excluded.avatar_url, accounts.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STEP FINALE: crea il record accounts per l'utente già loggato
-- ============================================================
insert into public.accounts (id, email, full_name, avatar_url)
select
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;
