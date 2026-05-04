'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Contract, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type ContractWithClient = Contract & { clients: Pick<Client, 'name' | 'company'> | null };

interface ContractFormProps {
  contract?: ContractWithClient | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const statusOptions = [
  { value: 'draft', label: 'Bozza' },
  { value: 'active', label: 'Attivo' },
  { value: 'expired', label: 'Scaduto' },
  { value: 'cancelled', label: 'Annullato' },
];

export function ContractForm({ contract, onSuccess, onCancel }: ContractFormProps) {
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: contract?.title ?? '',
    client_id: contract?.client_id ?? '',
    status: contract?.status ?? 'draft',
    start_date: contract?.start_date ?? '',
    end_date: contract?.end_date ?? '',
    total_value: contract?.total_value?.toString() ?? '0',
    notes: contract?.notes ?? '',
  });

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

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Il titolo è obbligatorio'); return; }
    if (!form.start_date) { setError('La data di inizio è obbligatoria'); return; }
    const total = parseFloat(form.total_value);
    if (isNaN(total)) { setError('Inserisci un valore valido'); return; }

    setLoading(true);
    setError('');

    try {
      if (contract) {
        const { error } = await supabase.from('contracts').update({
          title: form.title.trim(),
          client_id: form.client_id || contract.client_id,
          status: form.status as Contract['status'],
          start_date: form.start_date,
          end_date: form.end_date || null,
          total_value: total,
          notes: form.notes.trim() || null,
        }).eq('id', contract.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non autenticato');
        if (!form.client_id) { setError('Seleziona un cliente'); setLoading(false); return; }
        const { error } = await supabase.from('contracts').insert({
          account_id: user.id,
          title: form.title.trim(),
          client_id: form.client_id,
          status: form.status as Contract['status'],
          start_date: form.start_date,
          end_date: form.end_date || null,
          total_value: total,
          notes: form.notes.trim() || null,
        });
        if (error) throw error;
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Errore durante il salvataggio'));
    } finally {
      setLoading(false);
    }
  };

  const clientOptions = clients.map(c => ({
    value: c.id,
    label: c.company ? `${c.name} — ${c.company}` : c.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="title"
        label="Titolo contratto *"
        value={form.title}
        onChange={set('title')}
        placeholder="Social Media 2025"
        autoFocus
      />
      <Select
        id="client_id"
        label="Cliente *"
        value={form.client_id}
        onChange={set('client_id')}
        options={clientOptions}
        placeholder="Seleziona cliente..."
      />
      <Select
        id="status"
        label="Stato"
        value={form.status}
        onChange={set('status')}
        options={statusOptions}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          id="start_date"
          label="Data inizio *"
          type="date"
          value={form.start_date}
          onChange={set('start_date')}
        />
        <Input
          id="end_date"
          label="Data fine"
          type="date"
          value={form.end_date}
          onChange={set('end_date')}
        />
      </div>
      <Input
        id="total_value"
        label="Valore totale (€)"
        type="number"
        min="0"
        step="0.01"
        value={form.total_value}
        onChange={set('total_value')}
        placeholder="1200"
      />
      <Textarea
        id="notes"
        label="Note"
        value={form.notes}
        onChange={set('notes')}
        placeholder="Note sul contratto..."
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Annulla
        </Button>
        <Button type="submit" variant="white" disabled={loading}>
          {loading ? 'Salvataggio...' : contract ? 'Salva modifiche' : 'Crea contratto'}
        </Button>
      </div>
    </form>
  );
}
