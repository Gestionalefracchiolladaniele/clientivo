-- ============================================================
-- Unified Platform Schema: OneDigit + PulseMargin + QuoteBuilder
-- ============================================================

-- ACCOUNTS
create table accounts (
  id uuid primary key default auth.uid(),
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table accounts enable row level security;
create policy "account_isolation" on accounts
  for all using (id = auth.uid())
  with check (id = auth.uid());

-- CLIENTS (shared: OneDigit + QuoteBuilder)
create table clients (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  address text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table clients enable row level security;
create policy "account_isolation" on clients
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- PACKAGES (OneDigit)
create table packages (
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
create policy "account_isolation" on packages
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- CONTRACTS (OneDigit)
create table contracts (
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
create policy "account_isolation" on contracts
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- CONTRACT ITEMS (OneDigit)
create table contract_items (
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

-- USERS / TEAM (OneDigit)
create table team_users (
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
create policy "account_isolation" on team_users
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- PROJECTS (PulseMargin)
create table projects (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  contract_id uuid references contracts(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  budget numeric(10,2) default 0,
  margin_target numeric(5,2) default 30,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects enable row level security;
create policy "account_isolation" on projects
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- SUPPLIER COSTS (PulseMargin)
create table supplier_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  supplier_name text not null,
  description text,
  amount numeric(10,2) not null default 0,
  month date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table supplier_costs enable row level security;
create policy "account_isolation" on supplier_costs
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- MONTHLY ENTRIES (PulseMargin)
create table monthly_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  month date not null,
  revenue numeric(10,2) default 0,
  costs numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table monthly_entries enable row level security;
create policy "account_isolation" on monthly_entries
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- SHOOTINGS (PulseMargin)
create table shootings (
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
create policy "account_isolation" on shootings
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- QUOTES (QuoteBuilder)
create table quotes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  template_id uuid,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  valid_until date,
  notes text,
  total_amount numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table quotes enable row level security;
create policy "account_isolation" on quotes
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- QUOTE ITEMS (QuoteBuilder)
create table quote_items (
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

-- QUOTE TEMPLATES (QuoteBuilder)
create table quote_templates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  html_content text not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table quote_templates enable row level security;
create policy "account_isolation" on quote_templates
  for all using (account_id = auth.uid())
  with check (account_id = auth.uid());

-- Add foreign key for quotes.template_id after quote_templates is created
alter table quotes
  add constraint quotes_template_id_fkey
  foreign key (template_id) references quote_templates(id) on delete set null;

-- ============================================================
-- FUNCTION: auto-create account on first login
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
