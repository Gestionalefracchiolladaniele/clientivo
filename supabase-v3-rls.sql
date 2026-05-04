-- V3 Migration PARTE 2: RLS policies per tabella suppliers
-- Esegui DOPO supabase-v3-migration.sql
-- IMPORTANTE: esegui ogni statement UNO ALLA VOLTA se hai errori

create policy "team_read_suppliers" on suppliers
  for select using (account_id in (select get_accessible_account_ids()));

create policy "owner_insert_suppliers" on suppliers
  for insert with check (account_id = auth.uid());

create policy "owner_update_suppliers" on suppliers
  for update using (account_id = auth.uid());

create policy "owner_delete_suppliers" on suppliers
  for delete using (account_id = auth.uid());
