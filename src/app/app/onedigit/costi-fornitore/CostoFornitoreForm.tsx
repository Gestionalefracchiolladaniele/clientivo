'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { SupplierPriceList, Supplier } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';

interface Props {
  item?: SupplierPriceList | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const inputClass = "w-full h-9 px-3 rounded border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors";

export function CostoFornitoreForm({ item, onSuccess, onCancel }: Props) {
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    supplier_id: item?.supplier_id ?? '',
    supplier_name: item?.supplier_name ?? '',
    product_type: item?.product_type ?? '',
    cost_type: (item?.cost_type ?? 'fisso') as 'fisso' | 'variabile',
    volume: item?.volume?.toString() ?? '',
    unit_cost: item?.unit_cost?.toString() ?? '',
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('account_id', accountId)
        .order('nome');
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!accountId,
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setForm(prev => ({
      ...prev,
      supplier_id: supplierId,
      supplier_name: supplier?.nome ?? '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.supplier_name.trim()) { setError('Il fornitore è obbligatorio'); return; }
    if (!form.product_type.trim()) { setError('Il tipo prodotto è obbligatorio'); return; }
    const volume = parseInt(form.volume);
    if (isNaN(volume) || volume < 0) { setError('Volume non valido'); return; }
    const unit_cost = parseFloat(form.unit_cost);
    if (isNaN(unit_cost) || unit_cost < 0) { setError('Costo unitario non valido'); return; }

    setSaving(true);
    if (!accountId) { setError('Account non disponibile'); setSaving(false); return; }

    const payload = {
      supplier_name: form.supplier_name.trim(),
      supplier_id: form.supplier_id || null,
      product_type: form.product_type.trim(),
      cost_type: form.cost_type,
      volume,
      unit_cost,
    };

    let err;
    if (item) {
      ({ error: err } = await supabase.from('supplier_price_list').update(payload).eq('id', item.id));
    } else {
      ({ error: err } = await supabase.from('supplier_price_list').insert({ ...payload, account_id: accountId }));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Fornitore *</label>
          {suppliers.length > 0 ? (
            <select
              className={inputClass}
              value={form.supplier_id}
              onChange={e => handleSupplierChange(e.target.value)}
            >
              <option value="">Seleziona fornitore...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          ) : (
            <Input
              value={form.supplier_name}
              onChange={e => set('supplier_name', e.target.value)}
              placeholder="es. Meta Ads"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo Prodotto *</label>
          <Input
            value={form.product_type}
            onChange={e => set('product_type', e.target.value)}
            placeholder="es. Post, Reel, Video"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Tipo Costo</label>
          <select
            className={inputClass}
            value={form.cost_type}
            onChange={e => set('cost_type', e.target.value)}
          >
            <option value="fisso">Fisso</option>
            <option value="variabile">Variabile</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Volume (unità)</label>
          <Input
            type="number"
            min="0"
            value={form.volume}
            onChange={e => set('volume', e.target.value)}
            placeholder="es. 100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Costo Unitario (€)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.unit_cost}
            onChange={e => set('unit_cost', e.target.value)}
            placeholder="es. 2.50"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} variant="white" className="flex-1">
          {saving ? 'Salvataggio...' : item ? 'Aggiorna' : 'Aggiungi'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Annulla</Button>
      </div>
    </form>
  );
}
