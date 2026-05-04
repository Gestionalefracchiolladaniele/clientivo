'use client';

import { useState } from 'react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nome, setNome] = useState(supplier?.nome ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { setError('Il nome è obbligatorio'); return; }
    setSaving(true);
    setError('');

    try {
      if (supplier) {
        const { error } = await supabase.from('suppliers').update({ nome: nome.trim() }).eq('id', supplier.id);
        if (error) {
          console.error('Update error:', error);
          throw new Error(error.message || 'Errore durante l\'aggiornamento');
        }
      } else {
        if (!accountId) throw new Error('Account non disponibile');
        const { error } = await supabase.from('suppliers').insert({ nome: nome.trim(), account_id: accountId });
        if (error) {
          console.error('Insert error:', error);
          throw new Error(error.message || 'Errore durante l\'inserimento');
        }
      }
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Errore durante il salvataggio';
      console.error('Form error:', errorMsg, err);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-9 px-3 rounded border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Fornitore *</label>
        <input
          className={inputClass}
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Es. Meta Ads, Google Ads..."
          autoFocus
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} variant="white" className="flex-1">
          {saving ? 'Salvataggio...' : supplier ? 'Aggiorna' : 'Crea Fornitore'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Annulla</Button>
      </div>
    </form>
  );
}
