'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Client, Commercial, Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { useSedi } from '@/hooks/useSedi';

interface ClientFormProps {
  client?: Client | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();
  const sedi = useSedi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: client?.name ?? '',
    ragione_sociale: client?.ragione_sociale ?? '',
    insegna: client?.insegna ?? '',
    address: client?.address ?? '',
    cap: client?.cap ?? '',
    citta: client?.citta ?? '',
    partita_iva: client?.partita_iva ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    pec: client?.pec ?? '',
    agente: client?.agente ?? '',
    sede: client?.sede ?? '',
    data_firma_contratto: client?.data_firma_contratto ?? '',
    data_attivazione: client?.data_attivazione ?? '',
    fine_contratto: client?.fine_contratto ?? '',
    limite_disdetta: client?.limite_disdetta ?? '',
    commercial_id: client?.commercial_id ?? '',
    commission_override: client?.commission_override?.toString() ?? '',
    cpa: client?.cpa?.toString() ?? '',
    supplier_reel_id: client?.supplier_reel_id ?? '',
    notes: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const { data: commercials = [] } = useQuery<Commercial[]>({
    queryKey: ['commercials', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('commercials')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('account_id', accountId)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  const selectedCommercial = commercials.find(c => c.id === form.commercial_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Il nome è obbligatorio'); return; }
    setLoading(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      ragione_sociale: form.ragione_sociale.trim() || null,
      insegna: form.insegna.trim() || null,
      address: form.address.trim() || null,
      cap: form.cap.trim() || null,
      citta: form.citta.trim() || null,
      partita_iva: form.partita_iva.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      pec: form.pec.trim() || null,
      agente: form.agente.trim() || null,
      sede: form.sede || null,
      data_firma_contratto: form.data_firma_contratto || null,
      data_attivazione: form.data_attivazione || null,
      fine_contratto: form.fine_contratto || null,
      limite_disdetta: form.limite_disdetta || null,
      commercial_id: form.commercial_id || null,
      commission_override: form.commission_override ? parseFloat(form.commission_override) : null,
      cpa: form.cpa ? parseFloat(form.cpa) : null,
      supplier_reel_id: form.supplier_reel_id || null,
    };

    try {
      if (client) {
        const { error } = await supabase.from('clients').update(payload).eq('id', client.id);
        if (error) throw error;
      } else {
        if (!accountId) throw new Error('Account non disponibile');
        const { error } = await supabase.from('clients').insert({ ...payload, account_id: accountId });
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
  const sectionClass = "text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-4";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1">

      {/* Anagrafica base */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Nome *</label>
          <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Mario Rossi" autoFocus />
        </div>
        <div>
          <label className={labelClass}>Ragione Sociale</label>
          <input className={inputClass} value={form.ragione_sociale} onChange={set('ragione_sociale')} placeholder="Es. Rossi SRL" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Insegna</label>
        <input className={inputClass} value={form.insegna} onChange={set('insegna')} placeholder="Es. Bar Roma" />
      </div>

      <div>
        <label className={labelClass}>Indirizzo</label>
        <input className={inputClass} value={form.address} onChange={set('address')} placeholder="Via Roma 1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>CAP</label>
          <input className={inputClass} value={form.cap} onChange={set('cap')} placeholder="00100" />
        </div>
        <div>
          <label className={labelClass}>Città</label>
          <input className={inputClass} value={form.citta} onChange={set('citta')} placeholder="Roma" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Partita IVA</label>
        <input className={inputClass} value={form.partita_iva} onChange={set('partita_iva')} placeholder="IT12345678901" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Telefono</label>
          <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="+39 123 456 7890" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input className={inputClass} type="email" value={form.email} onChange={set('email')} placeholder="email@azienda.it" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>PEC</label>
          <input className={inputClass} value={form.pec} onChange={set('pec')} placeholder="email@pec.it" />
        </div>
        <div>
          <label className={labelClass}>Agente</label>
          <input className={inputClass} value={form.agente} onChange={set('agente')} placeholder="Nome Agente" />
        </div>
      </div>

      {/* Sede e contratto */}
      <p className={sectionClass}>Contratto</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Sede</label>
          <select className={inputClass} value={form.sede} onChange={set('sede')}>
            <option value="">Seleziona sede</option>
            {sedi.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Data Firma Contratto</label>
          <input className={inputClass} type="date" value={form.data_firma_contratto} onChange={set('data_firma_contratto')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Data Attivazione</label>
          <input className={inputClass} type="date" value={form.data_attivazione} onChange={set('data_attivazione')} />
        </div>
        <div>
          <label className={labelClass}>Fine Contratto</label>
          <input className={inputClass} type="date" value={form.fine_contratto} onChange={set('fine_contratto')} />
        </div>
        <div>
          <label className={labelClass}>Limite Disdetta</label>
          <input className={inputClass} type="date" value={form.limite_disdetta} onChange={set('limite_disdetta')} />
        </div>
      </div>

      {/* Commerciale */}
      <p className={sectionClass}>Commerciale</p>

      <div>
        <label className={labelClass}>Commerciale</label>
        <select className={inputClass} value={form.commercial_id} onChange={set('commercial_id')}>
          <option value="">Seleziona commerciale</option>
          {commercials.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Provvigione % Override</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.commission_override}
            onChange={set('commission_override')}
            placeholder={selectedCommercial ? `Default ${selectedCommercial.commission_percent}%` : 'Default comm.'}
          />
        </div>
        <div>
          <label className={labelClass}>CPA (€)</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            value={form.cpa}
            onChange={set('cpa')}
            placeholder="Costo acquisizione"
          />
        </div>
        <div>
          <label className={labelClass}>Fornitore Reel</label>
          <select className={inputClass} value={form.supplier_reel_id} onChange={set('supplier_reel_id')}>
            <option value="">Fornitore...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-zinc-900 pb-1">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Annulla
        </Button>
        <Button type="submit" variant="white" disabled={loading}>
          {loading ? 'Salvataggio...' : client ? 'Salva modifiche' : 'Crea cliente'}
        </Button>
      </div>
    </form>
  );
}
