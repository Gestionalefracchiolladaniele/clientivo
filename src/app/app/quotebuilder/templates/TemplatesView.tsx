'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, FileCode, Star } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { QuoteTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { TemplateForm } from './TemplateForm';

export function TemplatesView() {
  const supabase = supabaseClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('quote_templates')
        .select('*')
        .eq('account_id', user.id)
        .order('name');
      if (error) throw error;
      return data as QuoteTemplate[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quote_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast('Template eliminato');
      setDeletingId(null);
    },
    onError: () => toast('Errore durante l\'eliminazione', 'error'),
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await supabase.from('quote_templates').update({ is_default: false }).eq('account_id', user.id);
      await supabase.from('quote_templates').update({ is_default: true }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast('Template predefinito aggiornato');
    },
    onError: () => toast('Errore', 'error'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold -ml-0.5">Template</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{templates.length} template</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Nuovo template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-sm text-zinc-500">Caricamento...</div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileCode}
          title="Nessun template ancora"
          description="Crea un template HTML per personalizzare i tuoi preventivi."
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              Nuovo template
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(tmpl => (
            <div
              key={tmpl.id}
              className="bg-[#09090b] border border-white/10 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="font-medium text-white truncate">{tmpl.name}</span>
                </div>
                {tmpl.is_default && <Badge variant="success">Predefinito</Badge>}
              </div>

              <p className="text-xs text-zinc-600 font-mono truncate">
                {tmpl.html_content.slice(0, 80)}...
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                {!tmpl.is_default && (
                  <button
                    onClick={() => setDefaultMutation.mutate(tmpl.id)}
                    disabled={setDefaultMutation.isPending}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Imposta predefinito
                  </button>
                )}
                {tmpl.is_default && <span className="text-xs text-zinc-600">Template predefinito</span>}
                <button
                  onClick={() => setDeletingId(tmpl.id)}
                  className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-colors ml-auto"
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
        onClose={() => setShowForm(false)}
        title="Nuovo template"
      >
        <TemplateForm
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            toast('Template creato');
          }}
          onCancel={() => setShowForm(false)}
        />
      </Dialog>

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Elimina template"
        description="Questa azione è irreversibile. Il template verrà eliminato definitivamente."
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
