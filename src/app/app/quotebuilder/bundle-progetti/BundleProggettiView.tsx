'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { BundleProgetto } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { BundleProggettoForm } from './BundleProggettoForm';

type BundleWithCount = BundleProgetto & { bundle_items: { id: string }[] };

export default function BundleProggettiView() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BundleProgetto | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['bundle_progetti'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('bundle_progetti')
        .select('*, bundle_items(id)')
        .eq('account_id', accountId)
        .order('name');
      if (error) throw error;
      return data as BundleWithCount[];
    },
    enabled: !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bundle_progetti').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundle_progetti'] });
      toast('Bundle eliminato');
      setDeletingId(null);
    },
    onError: (err: Error) => toast(err.message || 'Errore durante l\'eliminazione', 'error'),
  });

  const openEdit = (b: BundleProgetto) => { setEditing(b); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };
  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['bundle_progetti'] });
    toast(editing ? 'Bundle aggiornato' : 'Bundle creato', 'success');
    closeForm();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold -ml-0.5">Bundle Progetti</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Raggruppa servizi template in bundle riutilizzabili. Click = aggiungi tutte le righe al preventivo.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nuovo bundle
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded animate-pulse" />
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nessun bundle ancora"
          description="Crea bundle di servizi per aggiungerli ai preventivi con un solo click."
        />
      ) : (
        <div className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-transparent border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Nome bundle</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Descrizione</th>
                <th className="text-center px-4 py-3 font-medium text-zinc-400">Servizi</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Stato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {bundles.map(b => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{b.name}</td>
                  <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">{b.description ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full">
                      <Layers className="w-3 h-3" />
                      {b.bundle_items.length} servizi
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 ${
                      b.is_active ? 'text-zinc-700' : 'text-zinc-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.is_active ? 'bg-green-400' : 'bg-zinc-400'}`} />
                      {b.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(b)}
                        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(b.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={showForm}
        onClose={closeForm}
        title={editing ? 'Modifica bundle' : 'Nuovo bundle'}
      >
        <BundleProggettoForm bundle={editing} onSuccess={handleSuccess} onCancel={closeForm} />
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        title="Elimina bundle"
        description="Questa azione non può essere annullata. Il bundle e i suoi servizi collegati verranno rimossi."
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        onClose={() => setDeletingId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
