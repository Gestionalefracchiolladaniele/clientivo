'use client';

import { useState } from 'react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { TemplateServizio } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';

interface Props {
  servizio?: TemplateServizio | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ServizioForm({ servizio, onSuccess, onCancel }: Props) {
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: servizio?.name ?? '',
    description: servizio?.description ?? '',
    price: servizio?.price?.toString() ?? '',
    unit: servizio?.unit ?? 'servizio',
    is_active: servizio?.is_active ?? true,
  });

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Il nome è obbligatorio'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError('Inserisci un prezzo valido'); return; }

    setSaving(true);
    if (!accountId) { setError('Account non disponibile'); setSaving(false); return; }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      unit: form.unit.trim() || 'servizio',
      is_active: form.is_active,
    };

    let err;
    if (servizio) {
      ({ error: err } = await supabase.from('template_servizi').update(payload).eq('id', servizio.id));
    } else {
      ({ error: err } = await supabase.from('template_servizi').insert({ ...payload, account_id: accountId }));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Nome servizio *</label>
        <Input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="es. Gestione Social Media"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Descrizione</label>
        <Textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Descrizione del servizio mostrata in preventivo..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Prezzo (€) *</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={e => set('price', e.target.value)}
            placeholder="500.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Unità</label>
          <Input
            value={form.unit}
            onChange={e => set('unit', e.target.value)}
            placeholder="servizio"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={e => set('is_active', e.target.checked)}
          className="accent-zinc-900 w-4 h-4"
        />
        <span className="text-sm text-zinc-300">Attivo (visibile nei preventivi)</span>
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} variant="white" className="flex-1">
          {saving ? 'Salvataggio...' : servizio ? 'Aggiorna' : 'Aggiungi'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Annulla</Button>
      </div>
    </form>
  );
}
