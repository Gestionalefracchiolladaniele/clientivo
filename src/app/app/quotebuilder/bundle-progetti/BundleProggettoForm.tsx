'use client';

import { useState, useEffect } from 'react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { BundleProgetto, TemplateServizio } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';

interface Props {
  bundle?: BundleProgetto | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BundleProggettoForm({ bundle, onSuccess, onCancel }: Props) {
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: bundle?.name ?? '',
    description: bundle?.description ?? '',
    is_active: bundle?.is_active ?? true,
  });

  const { data: servizi = [] } = useQuery({
    queryKey: ['template_servizi_form'],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await supabase
        .from('template_servizi')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('name');
      return (data ?? []) as TemplateServizio[];
    },
    enabled: !!accountId,
  });

  useEffect(() => {
    if (!bundle) return;
    (async () => {
      const { data } = await supabase
        .from('bundle_items')
        .select('template_servizio_id, order_position')
        .eq('bundle_id', bundle.id)
        .order('order_position');
      if (data) setSelectedIds(data.map(d => d.template_servizio_id));
    })();
  }, [bundle, supabase]);

  const toggleServizio = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Il nome è obbligatorio'); return; }
    if (selectedIds.length === 0) { setError('Seleziona almeno un servizio'); return; }

    setSaving(true);
    if (!accountId) { setError('Non autenticato'); setSaving(false); return; }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    let bundleId: string;
    if (bundle) {
      const { error: err } = await supabase.from('bundle_progetti').update(payload).eq('id', bundle.id);
      if (err) { setError(err.message); setSaving(false); return; }
      bundleId = bundle.id;
      await supabase.from('bundle_items').delete().eq('bundle_id', bundle.id);
    } else {
      const { data, error: err } = await supabase
        .from('bundle_progetti')
        .insert({ ...payload, account_id: accountId })
        .select('id')
        .single();
      if (err || !data) { setError(err?.message ?? 'Errore'); setSaving(false); return; }
      bundleId = data.id;
    }

    const { error: itemsErr } = await supabase.from('bundle_items').insert(
      selectedIds.map((sid, idx) => ({
        bundle_id: bundleId,
        template_servizio_id: sid,
        order_position: idx,
      }))
    );
    if (itemsErr) { setError(itemsErr.message); setSaving(false); return; }

    setSaving(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Nome bundle *</label>
        <Input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="es. Pacchetto Social Completo"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Descrizione</label>
        <Textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Breve descrizione del bundle..."
          rows={2}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">
          Servizi inclusi * <span className="text-zinc-600">({selectedIds.length} selezionati)</span>
        </label>
        {servizi.length === 0 ? (
          <p className="text-xs text-zinc-500 py-2">Nessun servizio template attivo. Creane prima in Servizi Template.</p>
        ) : (
          <div className="border border-zinc-700 rounded-lg overflow-hidden max-h-52 overflow-y-auto divide-y divide-zinc-800">
            {servizi.map((s, idx) => {
              const checked = selectedIds.includes(s.id);
              const order = selectedIds.indexOf(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                    checked ? 'bg-zinc-800' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleServizio(s.id)}
                    className="accent-zinc-100 w-4 h-4 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-zinc-200">{s.name}</span>
                    {s.description && (
                      <span className="text-xs text-zinc-500 ml-2 truncate">{s.description}</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums shrink-0">
                    {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(s.price)}
                  </span>
                  {checked && (
                    <span className="text-xs text-zinc-600 w-4 text-right shrink-0">#{order + 1}</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
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
          {saving ? 'Salvataggio...' : bundle ? 'Aggiorna' : 'Crea bundle'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Annulla</Button>
      </div>
    </form>
  );
}
