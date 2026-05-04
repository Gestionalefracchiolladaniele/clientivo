-- Verifica struttura reale di tutte le tabelle coinvolte
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('suppliers', 'clients', 'packages', 'supplier_price_list', 'accounts')
ORDER BY table_name, ordinal_position;
