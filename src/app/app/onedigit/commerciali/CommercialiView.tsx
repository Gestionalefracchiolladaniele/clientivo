'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Commercial } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { CommercialForm } from './CommercialForm';

export default function CommercialiView() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Commercial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  const { data: commercials = [], isLoading } = useQuery({
    queryKey: ['commercials'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('commercials')
        .select('*')
        .eq('account_id', accountId)
        .order('name');
      if (error) throw error;
      return data as Commercial[];
    },
    enabled: !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('commercials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercials'] });
      toast('Commerciale eliminato');
      setDeletingId(null);
    },
    onError: (err: Error) => toast(err.message || 'Errore durante l\'eliminazione', 'error'),
  });

  const openEdit = (c: Commercial) => { setEditing(c); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };
  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['commercials'] });
    toast(editing ? 'Commerciale aggiornato' : 'Commerciale aggiunto', 'success');
    closeForm();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold -ml-0.5">Commerciali</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Agenti commerciali e relative provvigioni.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Aggiungi
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded animate-pulse" />
          ))}
        </div>
      ) : commercials.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Nessun commerciale"
          description="Aggiungi il primo commerciale per iniziare."
        />
      ) : (
        <div className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-transparent border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Telefono</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">% Provvigione</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Stato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {commercials.map(c => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-zinc-300 font-medium">
                    {c.commission_percent}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                      c.is_active
                        ? 'bg-green-950/40 text-green-400'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-green-400' : 'bg-zinc-500'}`} />
                      {c.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(c.id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
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

      {/* Form dialog */}
      <Dialog
        open={showForm}
        onClose={closeForm}
        title={editing ? 'Modifica Commerciale' : 'Nuovo Commerciale'}
      >
        <CommercialForm
          commercial={editing}
          onSuccess={handleSuccess}
          onCancel={closeForm}
        />
      </Dialog>

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deletingId}
        title="Elimina Commerciale"
        description="Questa azione non può essere annullata. Il commerciale verrà rimosso."
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        onClose={() => setDeletingId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
