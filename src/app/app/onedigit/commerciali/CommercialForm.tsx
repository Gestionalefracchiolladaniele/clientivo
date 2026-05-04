'use client';

import { useState } from 'react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Commercial } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  commercial?: Commercial | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CommercialForm({ commercial, onSuccess, onCancel }: Props) {
  const supabase = supabaseClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: commercial?.name ?? '',
    email: commercial?.email ?? '',
    phone: commercial?.phone ?? '',
    commission_percent: commercial?.commission_percent != null ? String(commercial.commission_percent) : '0',
    is_active: commercial?.is_active ?? true,
  });

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Il nome è obbligatorio'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Non autenticato'); setSaving(false); return; }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      commission_percent: parseFloat(form.commission_percent) || 0,
      is_active: form.is_active,
    };

    let err;
    if (commercial) {
      ({ error: err } = await supabase.from('commercials').update(payload).eq('id', commercial.id));
    } else {
      ({ error: err } = await supabase.from('commercials').insert({ ...payload, account_id: user.id }));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Nome *</label>
        <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome commerciale" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
          <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@esempio.it" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Telefono</label>
          <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+39 333 1234567" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">% Provvigione</label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={form.commission_percent}
          onChange={e => set('commission_percent', e.target.value)}
          placeholder="es. 10"
        />
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => set('is_active', e.target.checked)}
            className="accent-zinc-900 w-4 h-4"
          />
          <span className="text-sm text-zinc-300">Attivo</span>
        </label>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} variant="white" className="flex-1">
          {saving ? 'Salvataggio...' : commercial ? 'Aggiorna' : 'Aggiungi'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Annulla</Button>
      </div>
    </form>
  );
}
