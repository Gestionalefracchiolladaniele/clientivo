'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, LayoutList } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { TemplateServizio } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { ServizioForm } from './ServizioForm';

const formatEur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

export default function ServiziView() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TemplateServizio | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  const { data: servizi = [], isLoading } = useQuery({
    queryKey: ['template_servizi'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('template_servizi')
        .select('*')
        .eq('account_id', accountId)
        .order('name');
      if (error) throw error;
      return data as TemplateServizio[];
    },
    enabled: !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('template_servizi').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template_servizi'] });
      toast('Servizio eliminato');
      setDeletingId(null);
    },
    onError: (err: Error) => toast(err.message || 'Errore durante l\'eliminazione', 'error'),
  });

  const openEdit = (s: TemplateServizio) => { setEditing(s); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };
  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['template_servizi'] });
    toast(editing ? 'Servizio aggiornato' : 'Servizio aggiunto', 'success');
    closeForm();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold -ml-0.5">Servizi Template</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Catalogo servizi riutilizzabili. Aggiungili ai preventivi con un click.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Aggiungi servizio
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-white/10 rounded animate-pulse" />
          ))}
        </div>
      ) : servizi.length === 0 ? (
        <EmptyState
          icon={LayoutList}
          title="Nessun servizio template"
          description="Crea il catalogo dei tuoi servizi per aggiungerli rapidamente ai preventivi."
        />
      ) : (
        <div className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-transparent border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Descrizione</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Unità</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Prezzo</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Stato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {servizi.map(s => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">{s.description ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-400">{s.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                    {formatEur(s.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                      s.is_active
                        ? 'bg-green-950/40 text-green-400'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.is_active ? 'bg-green-400' : 'bg-zinc-500'}`} />
                      {s.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(s.id)}
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

      <Dialog
        open={showForm}
        onClose={closeForm}
        title={editing ? 'Modifica servizio' : 'Nuovo servizio template'}
      >
        <ServizioForm servizio={editing} onSuccess={handleSuccess} onCancel={closeForm} />
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        title="Elimina servizio"
        description="Questa azione non può essere annullata. Il servizio verrà rimosso dal catalogo."
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        onClose={() => setDeletingId(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
