-- FIX: Correggi RLS policies per suppliers (usa tenant_id, non account_id)
-- Esegui tutto nel Supabase SQL Editor → New query → Run

-- Rimuovi le vecchie policies sbagliate (che usavano account_id)
DROP POLICY IF EXISTS "team_read_suppliers" ON suppliers;
DROP POLICY IF EXISTS "owner_insert_suppliers" ON suppliers;
DROP POLICY IF EXISTS "owner_update_suppliers" ON suppliers;
DROP POLICY IF EXISTS "owner_delete_suppliers" ON suppliers;

-- Ricrea con tenant_id corretto
CREATE POLICY "suppliers_tenant_read" ON suppliers
  FOR SELECT USING (tenant_id IN (SELECT get_accessible_account_ids()));

CREATE POLICY "suppliers_tenant_insert" ON suppliers
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "suppliers_tenant_update" ON suppliers
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "suppliers_tenant_delete" ON suppliers
  FOR DELETE USING (tenant_id = auth.uid());
