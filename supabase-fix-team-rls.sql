-- ============================================================
-- FIX: Aggiunge policy RLS mancanti per dipendenti (team members)
-- Risolve: commerciali, costi fornitore, contratti, impostazioni
--          non visibili ai dipendenti + errore creazione preventivi
-- Idempotente: sicuro da rieseguire più volte
-- Esegui nel Supabase SQL Editor → New query → Run
-- ============================================================

-- ============================================================
-- COMMERCIALS — dipendenti possono leggere
-- ============================================================
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'commercials' and policyname = 'team_access'
  ) then
    create policy "team_access" on commercials
      for select using (account_id in (select get_accessible_account_ids()));
  end if;
end $$;

-- ============================================================
-- SUPPLIER_PRICE_LIST — dipendenti possono leggere
-- ============================================================
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'supplier_price_list' and policyname = 'team_access'
  ) then
    create policy "team_access" on supplier_price_list
      for select using (account_id in (select get_accessible_account_ids()));
  end if;
end $$;

-- ============================================================
-- CONTRACTS — dipendenti possono leggere
-- ============================================================
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'contracts' and policyname = 'team_access'
  ) then
    create policy "team_access" on contracts
      for select using (account_id in (select get_accessible_account_ids()));
  end if;
end $$;

-- ============================================================
-- CONTRACT_ITEMS — dipendenti possono leggere (via join contracts)
-- ============================================================
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'contract_items' and policyname = 'team_access'
  ) then
    create policy "team_access" on contract_items
      for select using (
        exists (
          select 1 from contracts c
          where c.id = contract_items.contract_id
            and c.account_id in (select get_accessible_account_ids())
        )
      );
  end if;
end $$;

-- ============================================================
-- ACCOUNTS — dipendenti possono leggere i dati azienda dell'owner
-- (necessario per impostazioni, logo, numerazione preventivi)
-- Solo SELECT: i dipendenti non possono modificare i dati azienda
-- ============================================================
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'accounts' and policyname = 'team_read_owner'
  ) then
    create policy "team_read_owner" on accounts
      for select using (
        id in (
          select account_id from team_users
          where user_id = auth.uid() and status = 'active'
        )
      );
  end if;
end $$;

-- ============================================================
-- QUOTES — dipendenti possono creare, modificare, eliminare preventivi
-- L'INSERT usa account_id = owner's account_id (risolto da useEffectiveAccountId)
-- with check permette account_id che appartiene agli account accessibili
-- ============================================================
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quotes' and policyname = 'team_write'
  ) then
    create policy "team_write" on quotes
      for insert with check (
        account_id in (select get_accessible_account_ids())
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quotes' and policyname = 'team_update'
  ) then
    create policy "team_update" on quotes
      for update using (
        account_id in (select get_accessible_account_ids())
      ) with check (
        account_id in (select get_accessible_account_ids())
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quotes' and policyname = 'team_delete'
  ) then
    create policy "team_delete" on quotes
      for delete using (
        account_id in (select get_accessible_account_ids())
      );
  end if;
end $$;

-- ============================================================
-- QUOTE_ITEMS — dipendenti possono creare, modificare, eliminare righe
-- ============================================================
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quote_items' and policyname = 'team_write'
  ) then
    create policy "team_write" on quote_items
      for insert with check (
        quote_id in (
          select id from quotes where account_id in (select get_accessible_account_ids())
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quote_items' and policyname = 'team_update'
  ) then
    create policy "team_update" on quote_items
      for update using (
        quote_id in (
          select id from quotes where account_id in (select get_accessible_account_ids())
        )
      ) with check (
        quote_id in (
          select id from quotes where account_id in (select get_accessible_account_ids())
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'quote_items' and policyname = 'team_delete'
  ) then
    create policy "team_delete" on quote_items
      for delete using (
        quote_id in (
          select id from quotes where account_id in (select get_accessible_account_ids())
        )
      );
  end if;
end $$;
