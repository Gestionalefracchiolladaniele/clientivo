-- ============================================================
-- FIX: template_servizi — cleanup colonne vecchie + standardizza account_id
-- Questo risolve: "null value in column tenant_id violates not-null constraint"
-- Causa: tabella template_servizi aveva colonne obsolete (tenant_id, nome, descrizione, prezzo_unitario, iva_percent, categoria, solo_progetto)
-- Soluzione: rimuove colonne vecchie, standardizza su account_id, ricrea RLS policies
-- Idempotente — sicuro da rieseguire più volte
-- ============================================================

-- 1. Rimuovi tutte le policies (compresa quella che dipende da tenant_id)
DROP POLICY IF EXISTS "template_servizi_tenant" ON template_servizi;
DROP POLICY IF EXISTS "account_isolation" ON template_servizi;
DROP POLICY IF EXISTS "team_access" ON template_servizi;
DROP POLICY IF EXISTS "team_write" ON template_servizi;
DROP POLICY IF EXISTS "team_update" ON template_servizi;
DROP POLICY IF EXISTS "team_delete" ON template_servizi;

-- 2. Rimuovi colonne vecchie/obsolete
ALTER TABLE template_servizi DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE template_servizi DROP COLUMN IF EXISTS nome;
ALTER TABLE template_servizi DROP COLUMN IF EXISTS descrizione;
ALTER TABLE template_servizi DROP COLUMN IF EXISTS prezzo_unitario;
ALTER TABLE template_servizi DROP COLUMN IF EXISTS iva_percent;
ALTER TABLE template_servizi DROP COLUMN IF EXISTS categoria;
ALTER TABLE template_servizi DROP COLUMN IF EXISTS solo_progetto;

-- 3. Aggiungi colonne mancanti se non ci sono (idempotente)
ALTER TABLE template_servizi ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE template_servizi ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE template_servizi ADD COLUMN IF NOT EXISTS price numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE template_servizi ADD COLUMN IF NOT EXISTS unit text NOT NULL DEFAULT 'servizio';
ALTER TABLE template_servizi ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE template_servizi ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE template_servizi ADD COLUMN IF NOT EXISTS name text;

-- 4. Popola name dai dati esistenti se NULL
UPDATE template_servizi SET name = 'Servizio senza nome' WHERE name IS NULL;

-- 5. Rendi account_id e name NOT NULL
ALTER TABLE template_servizi ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE template_servizi ALTER COLUMN name SET NOT NULL;

-- 6. Abilita RLS se non abilitata
ALTER TABLE template_servizi ENABLE ROW LEVEL SECURITY;

-- 7. Ricrea policies corrette con account_id
CREATE POLICY "account_isolation" ON template_servizi
  FOR ALL USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

CREATE POLICY "team_access" ON template_servizi
  FOR SELECT USING (account_id IN (SELECT get_accessible_account_ids()));

CREATE POLICY "team_write" ON template_servizi
  FOR INSERT WITH CHECK (account_id IN (SELECT get_accessible_account_ids()));

CREATE POLICY "team_update" ON template_servizi
  FOR UPDATE USING (account_id IN (SELECT get_accessible_account_ids()))
  WITH CHECK (account_id IN (SELECT get_accessible_account_ids()));

CREATE POLICY "team_delete" ON template_servizi
  FOR DELETE USING (account_id IN (SELECT get_accessible_account_ids()));

-- 8. Forza refresh schema cache di Supabase
NOTIFY pgrst, 'reload schema';
