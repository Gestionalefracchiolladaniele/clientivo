'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { ClientForm } from './ClientForm';

export function ClientiView() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('account_id', accountId)
        .order('name');
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast('Cliente eliminato');
      setDeletingId(null);
    },
    onError: () => toast('Errore durante l\'eliminazione', 'error'),
  });

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight -ml-0.5">Clienti</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Management of client registry and activity history.
          </p>
        </div>
        <Button onClick={() => { setEditingClient(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" />
          Nuovo cliente
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Cerca clienti..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-3 h-9 rounded border border-white/20 bg-white/5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-sm text-zinc-400">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? 'Nessun risultato' : 'Nessun cliente ancora'}
          description={search ? 'Prova con altri termini di ricerca.' : 'Aggiungi il tuo primo cliente per iniziare.'}
          action={!search ? (
            <Button onClick={() => { setEditingClient(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" />
              Nuovo cliente
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="bg-[#09090b] rounded-lg border border-white/10 overflow-hidden shadow-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-transparent">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Ragione Sociale</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Sede</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Telefono</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map(client => (
                <tr key={client.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{client.name}</div>
                    {client.insegna && <div className="text-xs text-zinc-500">{client.insegna}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {client.ragione_sociale ? (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        {client.ragione_sociale}
                      </span>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {client.sede ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        {client.sede}
                      </span>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {client.email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        {client.email}
                      </span>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {client.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        {client.phone}
                      </span>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingClient(client); setShowForm(true); }}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(client.id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
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
        onClose={() => { setShowForm(false); setEditingClient(null); }}
        title={editingClient ? 'Modifica cliente' : 'Nuovo cliente'}
      >
        <ClientForm
          client={editingClient}
          onSuccess={() => {
            setShowForm(false);
            setEditingClient(null);
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast(editingClient ? 'Cliente aggiornato' : 'Cliente creato');
          }}
          onCancel={() => { setShowForm(false); setEditingClient(null); }}
        />
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Elimina cliente"
        description="Questa azione è irreversibile. Tutti i dati associati al cliente verranno eliminati."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
