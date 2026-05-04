'use client';

import { useState } from 'react';
import { createClient as supabaseClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><style>
  body { font-family: sans-serif; color: #111; }
  h1 { color: #4f46e5; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
  th { background: #f9fafb; }
  .total { font-weight: bold; text-align: right; }
</style></head>
<body>
  <h1>Preventivo</h1>
  <p>Data: {{data}}</p>
  <p>Cliente: {{cliente}}</p>
  <table>
    <thead><tr><th>Descrizione</th><th>Qtà</th><th>Prezzo</th><th>Totale</th></tr></thead>
    <tbody>{{voci}}</tbody>
  </table>
  <p class="total">Totale: {{totale}}</p>
</body>
</html>`;

interface TemplateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TemplateForm({ onSuccess, onCancel }: TemplateFormProps) {
  const supabase = supabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [isDefault, setIsDefault] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Il nome è obbligatorio'); return; }
    if (!html.trim()) { setError('Il contenuto HTML è obbligatorio'); return; }
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (isDefault) {
        await supabase.from('quote_templates').update({ is_default: false }).eq('account_id', user.id);
      }
      const { error: err } = await supabase.from('quote_templates').insert({
        account_id: user.id,
        name: name.trim(),
        html_content: html,
        is_default: isDefault,
      });
      if (err) throw err;
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Errore durante il salvataggio'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Nome template *</label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Es. Template standard"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Contenuto HTML *</label>
        <textarea
          value={html}
          onChange={e => setHtml(e.target.value)}
          rows={12}
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 resize-y"
          spellCheck={false}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Usa segnaposto: {'{{data}}'}, {'{{cliente}}'}, {'{{voci}}'}, {'{{totale}}'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_default"
          checked={isDefault}
          onChange={e => setIsDefault(e.target.checked)}
          className="rounded border-zinc-600 bg-zinc-800 accent-white"
        />
        <label htmlFor="is_default" className="text-sm text-zinc-300">Imposta come template predefinito</label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Annulla</Button>
        <Button type="submit" variant="white" disabled={loading}>
          {loading ? 'Salvataggio...' : 'Crea template'}
        </Button>
      </div>
    </form>
  );
}
