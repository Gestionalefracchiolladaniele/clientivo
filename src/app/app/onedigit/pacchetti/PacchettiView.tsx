'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Package as PackageIcon } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Package } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { PackageForm } from './PackageForm';

export function PacchettiView() {
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('account_id', accountId)
        .order('name');
      if (error) throw error;
      return data as Package[];
    },
    enabled: !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast('Pacchetto eliminato');
      setDeletingId(null);
    },
    onError: () => toast('Errore durante l\'eliminazione', 'error'),
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight -ml-0.5">Pacchetti</h1>
          <p className="text-sm text-zinc-400 mt-1">{packages.length} pacchetti totali</p>
        </div>
        <Button onClick={() => { setEditingPackage(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" />
          Nuovo pacchetto
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-sm text-zinc-400">Caricamento...</div>
      ) : packages.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="Nessun pacchetto ancora"
          description="Crea i tuoi pacchetti/servizi per poi associarli ai contratti."
          action={
            <Button onClick={() => { setEditingPackage(null); setShowForm(true); }}>
              <Plus className="w-4 h-4" />
              Nuovo pacchetto
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-[#09090b] rounded-lg border border-white/10 p-5 flex flex-col gap-3 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-sm text-zinc-400 mt-0.5 line-clamp-2">{pkg.description}</p>
                  )}
                </div>
                <Badge variant={pkg.is_active ? 'success' : 'secondary'}>
                  {pkg.is_active ? 'Attivo' : 'Inattivo'}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-white">{formatPrice(pkg.price)}</span>
                {pkg.duration_months && (
                  <span className="text-sm text-zinc-500">· {pkg.duration_months} mes{pkg.duration_months === 1 ? 'e' : 'i'}</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-white/10">
                <button
                  onClick={() => { setEditingPackage(pkg); setShowForm(true); }}
                  className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingId(pkg.id)}
                  className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingPackage(null); }}
        title={editingPackage ? 'Modifica pacchetto' : 'Nuovo pacchetto'}
      >
        <PackageForm
          pkg={editingPackage}
          onSuccess={() => {
            setShowForm(false);
            setEditingPackage(null);
            queryClient.invalidateQueries({ queryKey: ['packages'] });
            toast(editingPackage ? 'Pacchetto aggiornato' : 'Pacchetto creato');
          }}
          onCancel={() => { setShowForm(false); setEditingPackage(null); }}
        />
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Elimina pacchetto"
        description="Questa azione è irreversibile. Il pacchetto verrà rimosso da tutti i contratti associati."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
