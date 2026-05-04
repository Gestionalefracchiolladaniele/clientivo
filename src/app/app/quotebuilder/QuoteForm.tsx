'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Quote, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type QuoteWithClient = Quote & { clients: { name: string; company: string | null } | null };

interface QuoteFormProps {
  quote: QuoteWithClient | null;
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

export function QuoteForm({ quote, onSuccess, onCancel }: QuoteFormProps) {
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    client_id: '',
    status: 'draft' as Quote['status'],
    valid_until: '',
    notes: '',
  });

  useEffect(() => {
    if (quote) {
      setForm({
        title: quote.title,
        client_id: quote.client_id ?? '',
        status: quote.status,
        valid_until: quote.valid_until ?? '',
        notes: quote.notes ?? '',
      });
    }
  }, [quote]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, company')
        .eq('account_id', accountId)
        .order('name');
      if (error) throw error;
      return data as Pick<Client, 'id' | 'name' | 'company'>[];
    },
    enabled: !!accountId,
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Il titolo è obbligatorio'); return; }
    setLoading(true);
    setError('');
    try {
      if (!accountId) throw new Error('Account not ready');
      const payload = {
        title: form.title.trim(),
        client_id: form.client_id || null,
        status: form.status,
        valid_until: form.valid_until || null,
        notes: form.notes || null,
      };
      if (quote) {
        const { error: err } = await supabase.from('quotes').update(payload).eq('id', quote.id);
        if (err) throw err;
        onSuccess(quote.id);
      } else {
        const { data: account } = await supabase
          .from('accounts')
          .select('quote_numbering_prefix, quote_numbering_counter, quote_numbering_digits')
          .eq('id', accountId)
          .single();

        const prefix = account?.quote_numbering_prefix ?? 'PRV';
        const counter = account?.quote_numbering_counter ?? 1;
        const digits = account?.quote_numbering_digits ?? 4;
        const quoteNumber = `${prefix}-${counter.toString().padStart(digits, '0')}`;

        const { data, error: err } = await supabase.from('quotes').insert({
          ...payload,
          account_id: accountId,
          total_amount: 0,
          quote_number: quoteNumber,
        }).select('id').single();
        if (err) throw err;

        await supabase
          .from('accounts')
          .update({ quote_numbering_counter: counter + 1 })
          .eq('id', accountId);

        onSuccess(data.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Errore durante il salvataggio'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Titolo *</label>
        <Input
          value={form.title}
          onChange={e => set('title', e.target.value)}
          placeholder="Es. Proposta social media 2025"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Cliente</label>
        <select
          value={form.client_id}
          onChange={e => set('client_id', e.target.value)}
          className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="">Nessun cliente</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.company ? `${c.company} – ${c.name}` : c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Status</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="draft">Bozza</option>
            <option value="sent">Inviato</option>
            <option value="accepted">Accettato</option>
            <option value="rejected">Rifiutato</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Valido fino al</label>
          <Input
            type="date"
            value={form.valid_until}
            onChange={e => set('valid_until', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Note</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          rows={3}
          placeholder="Note interne o per il cliente..."
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Annulla</Button>
        <Button type="submit" variant="white" disabled={loading}>
          {loading ? 'Salvataggio...' : quote ? 'Salva modifiche' : 'Crea preventivo'}
        </Button>
      </div>
    </form>
  );
}
