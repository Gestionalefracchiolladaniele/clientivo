-- ============================================================
-- MIGRATIONS: tutto ciò che manca rispetto a supabase-fix-schema.sql
-- Sicuro da eseguire più volte (idempotente)
-- Esegui nel Supabase SQL Editor → New query → Run
-- ============================================================

-- ============================================================
-- 1. ACCOUNTS — colonne mancanti
-- ============================================================
alter table accounts add column if not exists company_name text;
alter table accounts add column if not exists ragione_sociale text;
alter table accounts add column if not exists partita_iva text;
alter table accounts add column if not exists codice_fiscale text;
alter table accounts add column if not exists address text;
alter table accounts add column if not exists cap text;
alter table accounts add column if not exists city text;
alter table accounts add column if not exists phone text;
alter table accounts add column if not exists website text;
alter table accounts add column if not exists logo_url text;

-- OneDigit
alter table accounts add column if not exists hourly_cost numeric(10,2) not null default 0;

-- QuoteBuilder — numerazione
alter table accounts add column if not exists quote_numbering_prefix text not null default 'PRV';
alter table accounts add column if not exists quote_numbering_counter int not null default 1;
alter table accounts add column if not exists quote_numbering_digits int not null default 4;

-- QuoteBuilder — pagamenti
alter table accounts add column if not exists quote_validity_days int not null default 30;
alter table accounts add column if not exists quote_payment_terms text;
alter table accounts add column if not exists quote_payment_methods jsonb not null default '[]'::jsonb;

-- QuoteBuilder — firma
alter table accounts add column if not exists quote_signature_name text;
alter table accounts add column if not exists quote_signature_role text;
alter table accounts add column if not exists quote_signature_image text;

-- QuoteBuilder — stile PDF
alter table accounts add column if not exists quote_color_primary text not null default '#09090b';
alter table accounts add column if not exists quote_color_text text not null default '#09090b';
alter table accounts add column if not exists quote_color_secondary text not null default '#71717a';
alter table accounts add column if not exists quote_font_size_base numeric(5,2) not null default 10;
alter table accounts add column if not exists quote_font_size_service numeric(5,2) not null default 9;
alter table accounts add column if not exists quote_font_size_price numeric(5,2) not null default 9;
alter table accounts add column if not exists quote_margin_top numeric(5,2) not null default 20;
alter table accounts add column if not exists quote_margin_right numeric(5,2) not null default 20;
alter table accounts add column if not exists quote_margin_bottom numeric(5,2) not null default 20;
alter table accounts add column if not exists quote_margin_left numeric(5,2) not null default 20;
alter table accounts add column if not exists quote_sections jsonb not null default '{
  "header_azienda": true,
  "box_cliente": true,
  "box_totali": true,
  "footer": true,
  "note_servizi": true,
  "titolo_preventivo": true,
  "allegato_tecnico": false,
  "firma": true
}'::jsonb;

-- ============================================================
-- 2. PACKAGES — colonne mancanti (campi contenuto OneDigit)
-- ============================================================
alter table packages add column if not exists post_count int not null default 0;
alter table packages add column if not exists reel_count int not null default 0;
alter table packages add column if not exists carousel_count int not null default 0;
alter table packages add column if not exists video_count int not null default 0;
alter table packages add column if not exists shooting_cost numeric(10,2) not null default 0;
alter table packages add column if not exists canone_una_tantum numeric(10,2);
alter table packages add column if not exists durata_minima_mesi int not null default 1;
alter table packages add column if not exists sede text;

-- ============================================================
-- 3. COMMERCIALS — crea se non esiste, altrimenti aggiunge colonne mancanti
-- ============================================================
create table if not exists commercials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

alter table commercials add column if not exists account_id uuid references accounts(id) on delete cascade;
alter table commercials add column if not exists email text;
alter table commercials add column if not exists phone text;
alter table commercials add column if not exists commission_percent numeric(5,2) not null default 0;
alter table commercials add column if not exists is_active boolean not null default true;
alter table commercials add column if not exists updated_at timestamptz default now();

alter table commercials enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='commercials' and policyname='account_isolation') then
    create policy "account_isolation" on commercials
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- 4. CONTRACTS — colonne mancanti
-- ============================================================
alter table contracts add column if not exists commercial_id uuid references commercials(id) on delete set null;
alter table contracts add column if not exists package_id uuid references packages(id) on delete set null;
alter table contracts add column if not exists auto_renew boolean not null default false;
alter table contracts add column if not exists cancelled_at timestamptz;
alter table contracts add column if not exists renewal_count int not null default 0;
alter table contracts add column if not exists canone_mensile numeric(10,2) not null default 0;

-- ============================================================
-- 5. SUPPLIER_PRICE_LIST — crea se non esiste, altrimenti aggiunge colonne mancanti
-- ============================================================
create table if not exists supplier_price_list (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  created_at timestamptz default now()
);

alter table supplier_price_list add column if not exists account_id uuid references accounts(id) on delete cascade;
alter table supplier_price_list add column if not exists product_type text not null default '';
alter table supplier_price_list add column if not exists volume int not null default 0;
alter table supplier_price_list add column if not exists unit_cost numeric(10,2) not null default 0;

alter table supplier_price_list enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='supplier_price_list' and policyname='account_isolation') then
    create policy "account_isolation" on supplier_price_list
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- 6. QUOTES — colonne mancanti
-- ============================================================
alter table quotes add column if not exists quote_number text;
alter table quotes add column if not exists logo_url text;
alter table quotes add column if not exists show_iva boolean not null default false;
alter table quotes add column if not exists iva_percent numeric(5,2) not null default 22;
alter table quotes add column if not exists payment_terms text;
alter table quotes add column if not exists signature_name text;
alter table quotes add column if not exists signature_role text;
alter table quotes add column if not exists is_exported_word boolean not null default false;

-- ============================================================
-- 7. QUOTE_ITEMS — colonne mancanti
-- ============================================================
alter table quote_items add column if not exists name text;
alter table quote_items add column if not exists unit text not null default 'servizio';

-- ============================================================
-- 8. TEMPLATE_SERVIZI — crea se non esiste, altrimenti aggiunge colonne mancanti
-- ============================================================
create table if not exists template_servizi (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

alter table template_servizi add column if not exists account_id uuid references accounts(id) on delete cascade;
alter table template_servizi add column if not exists description text;
alter table template_servizi add column if not exists price numeric(10,2) not null default 0;
alter table template_servizi add column if not exists unit text not null default 'servizio';
alter table template_servizi add column if not exists is_active boolean not null default true;
alter table template_servizi add column if not exists updated_at timestamptz default now();

alter table template_servizi enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='template_servizi' and policyname='account_isolation') then
    create policy "account_isolation" on template_servizi
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- 9. BUNDLE_PROGETTI — crea se non esiste, altrimenti aggiunge colonne mancanti
-- ============================================================
create table if not exists bundle_progetti (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

alter table bundle_progetti add column if not exists account_id uuid references accounts(id) on delete cascade;
alter table bundle_progetti add column if not exists description text;
alter table bundle_progetti add column if not exists is_active boolean not null default true;
alter table bundle_progetti add column if not exists updated_at timestamptz default now();

alter table bundle_progetti enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='bundle_progetti' and policyname='account_isolation') then
    create policy "account_isolation" on bundle_progetti
      for all using (account_id = auth.uid())
      with check (account_id = auth.uid());
  end if;
end $$;

-- ============================================================
-- 10. BUNDLE_ITEMS — crea se non esiste, altrimenti aggiunge colonne mancanti
-- RLS tramite join su bundle_progetti (non ha account_id diretto)
-- ============================================================
create table if not exists bundle_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

alter table bundle_items add column if not exists bundle_id uuid references bundle_progetti(id) on delete cascade;
alter table bundle_items add column if not exists template_servizio_id uuid references template_servizi(id) on delete cascade;
alter table bundle_items add column if not exists order_position int not null default 0;

alter table bundle_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='bundle_items' and policyname='account_isolation') then
    create policy "account_isolation" on bundle_items
      for all using (
        exists (
          select 1 from bundle_progetti
          where bundle_progetti.id = bundle_items.bundle_id
            and bundle_progetti.account_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from bundle_progetti
          where bundle_progetti.id = bundle_items.bundle_id
            and bundle_progetti.account_id = auth.uid()
        )
      );
  end if;
end $$;
