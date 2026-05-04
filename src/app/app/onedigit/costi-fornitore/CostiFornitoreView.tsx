'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Warehouse, Building2 } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { SupplierPriceList, Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { CostoFornitoreForm } from './CostoFornitoreForm';
import { SupplierForm } from './SupplierForm';

const formatEur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

type Tab = 'listino' | 'fornitori';

export default function CostiFornitoreView() {
  const [activeTab, setActiveTab] = useState<Tab>('listino');

  // Listino state
  const [showListinoForm, setShowListinoForm] = useState(false);
  const [editingListino, setEditingListino] = useState<SupplierPriceList | null>(null);
  const [deletingListinoId, setDeletingListinoId] = useState<string | null>(null);

  // Fornitori state
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplierId, setDeletingSupplierId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  // --- Listino query ---
  const { data: items = [], isLoading: listinoLoading } = useQuery({
    queryKey: ['supplier_price_list', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('supplier_price_list')
        .select('*')
        .eq('account_id', accountId)
        .order('supplier_name')
        .order('product_type')
        .order('volume');
      if (error) throw error;
      return data as SupplierPriceList[];
    },
    enabled: !!accountId,
  });

  // --- Fornitori query ---
  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
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

  // --- Mutations listino ---
  const deleteListinoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('supplier_price_list').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier_price_list'] });
      toast('Voce eliminata');
      setDeletingListinoId(null);
    },
    onError: (err: Error) => toast(err.message || 'Errore durante l\'eliminazione', 'error'),
  });

  // --- Mutations fornitori ---
  const deleteSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast('Fornitore eliminato');
      setDeletingSupplierId(null);
    },
    onError: (err: Error) => toast(err.message || 'Errore durante l\'eliminazione', 'error'),
  });

  const handleListinoSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['supplier_price_list'] });
    toast(editingListino ? 'Voce aggiornata' : 'Voce aggiunta', 'success');
    setShowListinoForm(false);
    setEditingListino(null);
  };

  const handleSupplierSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    toast(editingSupplier ? 'Fornitore aggiornato' : 'Fornitore creato', 'success');
    setShowSupplierForm(false);
    setEditingSupplier(null);
  };

  const tabClass = (tab: Tab) =>
    `flex-1 py-2 px-4 text-sm font-medium rounded transition-all ${
      activeTab === tab
        ? 'bg-zinc-700 text-white shadow'
        : 'text-zinc-400 hover:text-zinc-200'
    }`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold -ml-0.5">Costi Fornitore</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Gestisci fornitori e listino prezzi per fascia volume.
          </p>
        </div>
        <Button onClick={() => activeTab === 'listino' ? setShowListinoForm(true) : setShowSupplierForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {activeTab === 'listino' ? 'Aggiungi voce' : 'Nuovo fornitore'}
        </Button>
      </div>

      {/* Tab toggle */}
      <div className="bg-zinc-800 rounded-lg p-1 flex gap-1 mb-6 max-w-xs">
        <button type="button" className={tabClass('listino')} onClick={() => setActiveTab('listino')}>
          Listino Costi
        </button>
        <button type="button" className={tabClass('fornitori')} onClick={() => setActiveTab('fornitori')}>
          Fornitori
        </button>
      </div>

      {/* ===== LISTINO COSTI ===== */}
      {activeTab === 'listino' && (
        <>
          {listinoLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Warehouse}
              title="Nessun costo fornitore"
              description="Aggiungi il listino prezzi per calcolare i margini automaticamente."
            />
          ) : (
            <div className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider">Fornitore</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider">Tipo Prodotto</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider">Tipo Costo</th>
                    <th className="text-right px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider">Volume</th>
                    <th className="text-right px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider">Costo Unit.</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{item.supplier_name}</td>
                      <td className="px-4 py-3 text-zinc-400">{item.product_type}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.cost_type === 'fisso'
                            ? 'bg-zinc-700 text-zinc-300'
                            : 'bg-zinc-700/50 text-zinc-400'
                        }`}>
                          {item.cost_type === 'fisso' ? 'Fisso' : 'Variabile'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                        {item.volume.toLocaleString('it-IT')}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">
                        {formatEur(item.unit_cost)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingListino(item); setShowListinoForm(true); }}
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingListinoId(item.id)}
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
        </>
      )}

      {/* ===== FORNITORI ===== */}
      {activeTab === 'fornitori' && (
        <>
          {suppliersLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nessun fornitore"
              description="Aggiungi i tuoi fornitori per associarli al listino prezzi."
            />
          ) : (
            <div className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-zinc-400 text-xs uppercase tracking-wider">Nome Fornitore</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {suppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{supplier.nome}</td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingSupplier(supplier); setShowSupplierForm(true); }}
                            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingSupplierId(supplier.id)}
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
        </>
      )}

      {/* Dialog Listino */}
      <Dialog
        open={showListinoForm}
        onClose={() => { setShowListinoForm(false); setEditingListino(null); }}
        title={editingListino ? 'Modifica voce' : 'Nuova voce listino'}
      >
        <CostoFornitoreForm
          item={editingListino}
          onSuccess={handleListinoSuccess}
          onCancel={() => { setShowListinoForm(false); setEditingListino(null); }}
        />
      </Dialog>

      {/* Dialog Fornitore */}
      <Dialog
        open={showSupplierForm}
        onClose={() => { setShowSupplierForm(false); setEditingSupplier(null); }}
        title={editingSupplier ? 'Modifica fornitore' : 'Nuovo Fornitore'}
      >
        <SupplierForm
          supplier={editingSupplier}
          onSuccess={handleSupplierSuccess}
          onCancel={() => { setShowSupplierForm(false); setEditingSupplier(null); }}
        />
      </Dialog>

      {/* Confirm delete listino */}
      <ConfirmDialog
        open={!!deletingListinoId}
        title="Elimina voce"
        description="Questa azione non può essere annullata."
        onConfirm={() => deletingListinoId && deleteListinoMutation.mutate(deletingListinoId)}
        onClose={() => setDeletingListinoId(null)}
        loading={deleteListinoMutation.isPending}
      />

      {/* Confirm delete fornitore */}
      <ConfirmDialog
        open={!!deletingSupplierId}
        title="Elimina fornitore"
        description="Questa azione non può essere annullata."
        onConfirm={() => deletingSupplierId && deleteSupplierMutation.mutate(deletingSupplierId)}
        onClose={() => setDeletingSupplierId(null)}
        loading={deleteSupplierMutation.isPending}
      />
    </div>
  );
}
