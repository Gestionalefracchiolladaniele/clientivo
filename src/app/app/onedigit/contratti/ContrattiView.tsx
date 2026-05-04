'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Contract, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { ContractForm } from './ContractForm';

type ContractWithClient = Contract & { clients: Pick<Client, 'name' | 'company'> | null };
type StatusFilter = 'all' | Contract['status'];

const statusLabels: Record<Contract['status'], string> = {
  active: 'Attivo',
  draft: 'Bozza',
  expired: 'Scaduto',
  cancelled: 'Annullato',
};

const statusVariant: Record<Contract['status'], 'success' | 'secondary' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  draft: 'secondary',
  expired: 'warning',
  cancelled: 'danger',
};

export function ContrattiView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractWithClient | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('contracts')
        .select('*, clients(name, company)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContractWithClient[];
    },
    enabled: !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast('Contratto eliminato');
      setDeletingId(null);
    },
    onError: () => toast('Errore durante l\'eliminazione', 'error'),
  });

  const filtered = statusFilter === 'all' ? contracts : contracts.filter(c => c.status === statusFilter);

  const formatEur = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

  const formatDate = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: it });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight -ml-0.5">Contratti</h1>
          <p className="text-sm text-zinc-400 mt-1">{contracts.length} contratti totali</p>
        </div>
        <Button onClick={() => { setEditingContract(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" />
          Nuovo contratto
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 rounded-lg p-1 w-fit">
        {(['all', 'active', 'draft', 'expired', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-white text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {s === 'all' ? 'Tutti' : statusLabels[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-sm text-zinc-400">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nessun contratto"
          description={statusFilter !== 'all' ? 'Nessun contratto con questo stato.' : 'Crea il tuo primo contratto.'}
          action={statusFilter === 'all' ? (
            <Button onClick={() => { setEditingContract(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" />
              Nuovo contratto
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Titolo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Inizio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Fine</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Valore</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map(contract => (
                <tr key={contract.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{contract.title}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {contract.clients
                      ? contract.clients.company ?? contract.clients.name
                      : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[contract.status]}>
                      {statusLabels[contract.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(contract.start_date)}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {contract.end_date ? formatDate(contract.end_date) : <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">
                    {formatEur(contract.total_value)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingContract(contract); setShowForm(true); }}
                        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(contract.id)}
                        className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
        onClose={() => { setShowForm(false); setEditingContract(null); }}
        title={editingContract ? 'Modifica contratto' : 'Nuovo contratto'}
        className="max-w-xl"
      >
        <ContractForm
          contract={editingContract}
          onSuccess={() => {
            setShowForm(false);
            setEditingContract(null);
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast(editingContract ? 'Contratto aggiornato' : 'Contratto creato');
          }}
          onCancel={() => { setShowForm(false); setEditingContract(null); }}
        />
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Elimina contratto"
        description="Questa azione è irreversibile. Il contratto e tutte le sue voci verranno eliminati."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
