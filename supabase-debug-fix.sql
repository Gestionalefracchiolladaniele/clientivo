-- ============================================================
-- FIX FK: quotes → clients + reload schema cache
-- Esegui nel Supabase SQL Editor → New query → Run
-- ============================================================

-- 1. Aggiungi FK tra quotes.client_id e clients.id (se non esiste già)
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
    where tc.table_name = 'quotes'
      and tc.constraint_type = 'FOREIGN KEY'
      and kcu.column_name = 'client_id'
  ) then
    alter table quotes
      add constraint quotes_client_id_fkey
      foreign key (client_id) references clients(id) on delete set null;
  end if;
end $$;

-- 2. Ricarica lo schema cache di PostgREST
-- (necessario dopo aver aggiunto FK)
notify pgrst, 'reload schema';

-- 3. Verifica che la FK esista
select
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name as foreign_table,
  ccu.column_name as foreign_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
where tc.table_name = 'quotes'
  and tc.constraint_type = 'FOREIGN KEY';
