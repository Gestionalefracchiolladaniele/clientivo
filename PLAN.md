# PLAN.md — Piano Implementazione v2.0
> Aggiornato: 2026-04-27 · Stato: quasi completo — solo Export Word rimasto

## Decisioni già prese (non riaprire)
1. PulseMargin rimosso — tab, pagine, componenti e tabelle DB eliminate
2. QuoteBuilder: anteprima preventivo in-app come componente React visivo (no html2pdf, no html_content)
3. OneDigit: arricchito con Dashboard KPI, Pacchetti campi contenuto, Costi Fornitore, Storico Contratti, Commerciali
4. Design: invariato — zinc monochromatic, mesh-bg, dark monolith KPI (DESIGN.md)
5. Multi-pacchetto: 1 cliente → N contratti con package_id separati (N:1)
6. Inserimento servizi: click-to-add da catalogo (NO drag-drop)
7. Bundle: raggruppamento servizi template riutilizzabili
8. Logo upload: URL esterno in v1.0 (no Supabase Storage)
9. Duplicazione preventivo: copia + auto-numerazione progressiva ✅ implementato
10. Export Word: libreria `docx` + `file-saver` (`pnpm add docx file-saver @types/file-saver`)

---

## Cosa c'è già (non rifare) ✅

### Infrastruttura
- Sidebar dark collassabile, Auth flow (login + Google OAuth + callback + proxy)
- UI components, DB schema (`supabase-fix-schema.sql`), RLS, types.ts completo

### OneDigit — tutto completo ✅
- Clienti, Pacchetti (con campi contenuto), Contratti, Commerciali
- Costi Fornitore CRUD (`/app/onedigit/costi-fornitore`)
- Storico Contratti (`/app/onedigit/storico-contratti`) — KPI + tabs
- **Dashboard KPI** ✅ (`/app/onedigit`) — navigatore mese, KPI anno/mese, tabella clienti attivi con canone/provvigione/margine

### QuoteBuilder — quasi tutto completo ✅
- Preventivi dashboard (con filtri, KPI, search)
- **Editor aggiornato** ✅ (`/app/quotebuilder/[id]`) — name+desc separati, sidebar Servizi|Bundle click-to-add, bottoni Anteprima+Duplica
- **Servizi Template** CRUD ✅ (`/app/quotebuilder/servizi`)
- **Bundle Progetti** CRUD ✅ (`/app/quotebuilder/bundle-progetti`) — multi-select servizi, ordine posizione
- **Anteprima preventivo** ✅ (`/app/quotebuilder/[id]/anteprima`) — A4 React, sezioni condizionali, stile inline, Print CSS
- **Duplicazione** ✅ — copia quote+items, auto-numerazione, redirect nuovo preventivo
- Impostazioni 3 tab (Numerazione, Pagamenti, Firma) (`/app/quotebuilder/impostazioni`)

### Sidebar
- OneDigit: Dashboard · Clienti · Pacchetti · Commerciali · Costi Fornitore · Storico Contratti
- QuoteBuilder: Preventivi · Servizi Template · Bundle Progetti · Impostazioni ✅

---

## Cosa manca 🔲

### SQL da eseguire in Supabase (se non già fatto)
**Step 2.9** — `bundle_progetti` + `bundle_items` (necessario per Bundle Progetti):
```sql
create table if not exists bundle_progetti (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null, description text, is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table bundle_progetti enable row level security;
create policy "account_isolation" on bundle_progetti for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create table if not exists bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references bundle_progetti(id) on delete cascade,
  template_servizio_id uuid not null references template_servizi(id) on delete cascade,
  order_position int default 0, created_at timestamptz default now()
);
alter table bundle_items enable row level security;
create policy "account_isolation" on bundle_items for all using (
  exists (select 1 from bundle_progetti where bundle_progetti.id = bundle_items.bundle_id and bundle_progetti.account_id = auth.uid())
) with check (
  exists (select 1 from bundle_progetti where bundle_progetti.id = bundle_items.bundle_id and bundle_progetti.account_id = auth.uid())
);
```

### 4.6 Export Word 🔲 (unico rimasto)
`pnpm add docx file-saver @types/file-saver`

Bottone "Export Word" nell'editor/anteprima:
1. Genera `.docx` con: header azienda, box cliente, tabella righe, totali, footer firma
2. Rispetta `quote_margin_*` e `quote_color_primary` da accounts
3. `Packer.toBlob(doc)` → `saveAs(blob, 'preventivo_XXX.docx')`
4. Imposta `is_exported_word = true` sul record quotes

---

## Step 2 — SQL Schema (archivio — tutti già implementati nel codice)

Tutti gli step 2.1–2.9 sono già riflessi in `types.ts`. Eseguire in Supabase quelli mancanti:
- 2.1 accounts (dati azienda + quote settings)
- 2.2 packages (campi contenuto)
- 2.3 commercials (tabella)
- 2.4 supplier_price_list (tabella)
- 2.5 contracts (campi aggiuntivi)
- 2.6 quotes (quote_number, show_iva, ecc.)
- 2.7 quote_items (name, unit)
- 2.8 template_servizi (tabella)
- **2.9 bundle_progetti + bundle_items** ← necessario per la sessione 4

---

## Ordine di esecuzione completato
```
✅  SQL Step 2 in Supabase (tutti gli step)
✅  types.ts — completo con bundle_progetti, bundle_items
✅  OneDigit: Costi Fornitore (CRUD)
✅  OneDigit: PackageForm aggiornato
✅  OneDigit: Storico Contratti (view)
✅  OneDigit: Dashboard KPI (sessione 4)
✅  QuoteBuilder: Servizi Template (CRUD)
✅  QuoteBuilder: Bundle Progetti (CRUD) (sessione 4)
✅  QuoteBuilder: Editor aggiornato (name+desc+sidebar Servizi/Bundle+Anteprima+Duplica) (sessione 4)
✅  QuoteBuilder: Anteprima preventivo React + Print CSS (sessione 4)
✅  QuoteBuilder: Duplicazione preventivo (sessione 4)
✅  Sidebar: sub-nav completo (sessione 4)
🔲  QuoteBuilder: Export Word (.docx via docx + file-saver)
🔲  Smoke test completo
```

## Note tecniche
- **Print CSS**: `.no-print` in `globals.css` @media print — applicare a toolbar e sidebar nell'anteprima
- **Auto-numerazione**: `counter.toString().padStart(digits, '0')`, poi `update accounts set quote_numbering_counter = counter + 1`
- **quote_payment_methods**: jsonb — `JSON.parse/stringify` lato React. Tipo: `Array<{name: string; iban?: string; details?: string}>`
- **Stile PDF inline**: `style={{ color: account.quote_color_primary, fontSize: account.quote_font_size_base }}`
- **Sezioni condizionali**: `{account.quote_sections.box_cliente && <ClienteSection />}`
- **Lookup costo fornitore**: dato volume N, prendere la riga con volume massimo ≤ N per tipo prodotto
- **Sidebar click-to-add editor**: servizio → aggiunge 1 riga; bundle → aggiunge tutte le righe in order_position
- **Bundle query**: `bundle_items(order_position, template_servizi(*))` — join con servizi
- **QuoteEditor layout**: `flex h-full` con sidebar destra fissa 288px (w-72)
- **quote_templates**: tabella rimane nel DB, pagina Templates rimossa dalla sidebar. Non droppare.
- **Dashboard OneDigit**: "attivo nel mese" = status='active' AND start_date ≤ fine_mese AND (end_date null OR end_date ≥ inizio_mese)
