-- V3 Migration: sedi, campi cliente, tipo_pacchetto, supplier_price_list
-- La tabella suppliers esiste già con colonne: id, tenant_id, nome, created_at
-- NON toccare suppliers, usare com'è

-- ============================================================
-- accounts: aggiunta colonna sedi
-- ============================================================
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS sedi text[] DEFAULT '{}';

-- ============================================================
-- clients: nuovi campi
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ragione_sociale text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS insegna text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cap text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS citta text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS partita_iva text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pec text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS agente text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sede text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_firma_contratto date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS data_attivazione date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fine_contratto date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS limite_disdetta date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS commercial_id uuid;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS commission_override numeric(5,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cpa numeric(10,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS supplier_reel_id uuid;

-- ============================================================
-- packages: nuovi campi
-- ============================================================
ALTER TABLE packages ADD COLUMN IF NOT EXISTS tipo_pacchetto text DEFAULT 'contenuto';
ALTER TABLE packages ADD COLUMN IF NOT EXISTS budget_pubblicitario numeric(10,2);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS durata_minima_mesi integer DEFAULT 1;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS canone_una_tantum numeric(10,2);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'packages_tipo_pacchetto_check'
  ) THEN
    ALTER TABLE packages ADD CONSTRAINT packages_tipo_pacchetto_check
      CHECK (tipo_pacchetto IN ('contenuto', 'servizio'));
  END IF;
END $$;

-- ============================================================
-- supplier_price_list: cost_type + supplier_id
-- ============================================================
ALTER TABLE supplier_price_list ADD COLUMN IF NOT EXISTS cost_type text DEFAULT 'fisso';
ALTER TABLE supplier_price_list ADD COLUMN IF NOT EXISTS supplier_id uuid;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'supplier_price_list_cost_type_check'
  ) THEN
    ALTER TABLE supplier_price_list ADD CONSTRAINT supplier_price_list_cost_type_check
      CHECK (cost_type IN ('fisso', 'variabile'));
  END IF;
END $$;

-- FK supplier_price_list -> suppliers (usa id della tabella esistente)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_supplier_price_list_supplier'
  ) THEN
    ALTER TABLE supplier_price_list
      ADD CONSTRAINT fk_supplier_price_list_supplier
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;
