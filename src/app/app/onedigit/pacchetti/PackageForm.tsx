'use client';

import { useState } from 'react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Package } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { useSedi } from '@/hooks/useSedi';
import { Layers, Settings2 } from 'lucide-react';

interface PackageFormProps {
  pkg?: Package | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PackageForm({ pkg, onSuccess, onCancel }: PackageFormProps) {
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();
  const sedi = useSedi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipoPacchetto, setTipoPacchetto] = useState<'contenuto' | 'servizio'>(
    pkg?.tipo_pacchetto ?? 'contenuto'
  );
  const [form, setForm] = useState({
    name: pkg?.name ?? '',
    sede: pkg?.sede ?? '',
    price: pkg?.price?.toString() ?? '0',
    canone_una_tantum: pkg?.canone_una_tantum?.toString() ?? '',
    duration_months: pkg?.duration_months?.toString() ?? '12',
    durata_minima_mesi: pkg?.durata_minima_mesi?.toString() ?? '1',
    post_count: pkg?.post_count?.toString() ?? '0',
    reel_count: pkg?.reel_count?.toString() ?? '0',
    carousel_count: pkg?.carousel_count?.toString() ?? '0',
    video_count: pkg?.video_count?.toString() ?? '0',
    shooting_cost: pkg?.shooting_cost?.toString() ?? '0',
    budget_pubblicitario: pkg?.budget_pubblicitario?.toString() ?? '0',
    is_active: pkg?.is_active ?? true,
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Il nome è obbligatorio'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError('Inserisci un canone valido'); return; }

    setLoading(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      sede: form.sede || null,
      price,
      canone_una_tantum: form.canone_una_tantum ? parseFloat(form.canone_una_tantum) : null,
      duration_months: form.duration_months ? parseInt(form.duration_months) : null,
      durata_minima_mesi: parseInt(form.durata_minima_mesi) || 1,
      is_active: form.is_active,
      tipo_pacchetto: tipoPacchetto,
      description: null as string | null,
      // Contenuto fields (zero for servizio)
      post_count: tipoPacchetto === 'contenuto' ? (parseInt(form.post_count) || 0) : 0,
      reel_count: tipoPacchetto === 'contenuto' ? (parseInt(form.reel_count) || 0) : 0,
      carousel_count: tipoPacchetto === 'contenuto' ? (parseInt(form.carousel_count) || 0) : 0,
      video_count: tipoPacchetto === 'contenuto' ? (parseInt(form.video_count) || 0) : 0,
      shooting_cost: tipoPacchetto === 'contenuto' ? (parseFloat(form.shooting_cost) || 0) : 0,
      // Servizio field
      budget_pubblicitario: tipoPacchetto === 'servizio' ? (parseFloat(form.budget_pubblicitario) || 0) : null,
    };

    try {
      if (pkg) {
        const { error } = await supabase.from('packages').update(payload).eq('id', pkg.id);
        if (error) throw error;
      } else {
        if (!accountId) throw new Error('Account non disponibile');
        const { error } = await supabase.from('packages').insert({ ...payload, account_id: accountId });
        if (error) throw error;
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-9 px-3 rounded border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors";
  const labelClass = "block text-xs font-medium text-zinc-400 mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Nome + Sede */}
      <div className="grid grid-cols-[1fr_140px] gap-3">
        <div>
          <label className={labelClass}>Nome Pacchetto *</label>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Es. Social Base, Google Ads..." autoFocus />
        </div>
        <div>
          <label className={labelClass}>Sede *</label>
          <select className={inputClass} value={form.sede} onChange={set('sede')}>
            <option value="">Sede...</option>
            {sedi.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Toggle Contenuto / Servizio */}
      <div className="bg-zinc-800 rounded-lg p-1 flex gap-1">
        <button
          type="button"
          onClick={() => setTipoPacchetto('contenuto')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-all ${
            tipoPacchetto === 'contenuto'
              ? 'bg-zinc-600 text-white shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Contenuto
        </button>
        <button
          type="button"
          onClick={() => setTipoPacchetto('servizio')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-all ${
            tipoPacchetto === 'servizio'
              ? 'bg-zinc-600 text-white shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          Servizio
        </button>
      </div>

      {/* Contenuto specifico */}
      {tipoPacchetto === 'contenuto' && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Contenuti mensili</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Post</label>
              <input className={inputClass} type="number" min="0" value={form.post_count} onChange={set('post_count')} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Reel</label>
              <input className={inputClass} type="number" min="0" value={form.reel_count} onChange={set('reel_count')} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Caroselli</label>
              <input className={inputClass} type="number" min="0" value={form.carousel_count} onChange={set('carousel_count')} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Video</label>
              <input className={inputClass} type="number" min="0" value={form.video_count} onChange={set('video_count')} placeholder="0" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Costo Shooting (€)</label>
            <input className={inputClass} type="number" min="0" step="0.01" value={form.shooting_cost} onChange={set('shooting_cost')} placeholder="0" />
          </div>
        </div>
      )}

      {/* Servizio specifico */}
      {tipoPacchetto === 'servizio' && (
        <div className="rounded-lg border border-dashed border-zinc-600 bg-zinc-800/50 p-4 flex flex-col gap-3">
          <p className="text-sm text-zinc-400 text-center">
            I pacchetti Servizio (es. Google Ads, Consulenza) non includono contenuti creativi.<br />
            <span className="text-zinc-500">Compila solo il canone mensile e la durata.</span>
          </p>
          <div>
            <label className={labelClass}>Budget Pubblicitario Incluso (€)</label>
            <input className={inputClass} type="number" min="0" step="0.01" value={form.budget_pubblicitario} onChange={set('budget_pubblicitario')} placeholder="0.00" />
            <p className="text-xs text-zinc-500 mt-1">Importo del budget pubblicitario incluso nel pacchetto. Verrà conteggiato come costo.</p>
          </div>
        </div>
      )}

      {/* Prezzi e durate */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Canone Mensile (€) *</label>
          <input className={inputClass} type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="0.00" />
        </div>
        <div>
          <label className={labelClass}>Canone Una Tantum (€)</label>
          <input className={inputClass} type="number" min="0" step="0.01" value={form.canone_una_tantum} onChange={set('canone_una_tantum')} placeholder="Opzionale" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Durata Default (mesi)</label>
          <input className={inputClass} type="number" min="1" value={form.duration_months} onChange={set('duration_months')} placeholder="12" />
        </div>
        <div>
          <label className={labelClass}>Durata Minima (mesi)</label>
          <input className={inputClass} type="number" min="1" value={form.durata_minima_mesi} onChange={set('durata_minima_mesi')} placeholder="1" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
          className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 accent-white"
        />
        <span className="text-sm font-medium text-zinc-300">Pacchetto attivo</span>
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Annulla</Button>
        <Button type="submit" variant="white" disabled={loading}>
          {loading ? 'Salvataggio...' : pkg ? 'Salva modifiche' : 'Crea Pacchetto'}
        </Button>
      </div>
    </form>
  );
}
