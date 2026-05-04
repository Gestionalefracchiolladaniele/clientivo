'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Eye, FileText, Copy, Send } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Quote } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SendQuoteDialog } from '@/components/SendQuoteDialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';

type QuoteWithClient = Quote & { clients: { name: string; company: string | null; email: string | null } | null };

const statusConfig = {
  draft: { label: 'Bozza', variant: 'secondary' as const },
  sent: { label: 'Inviato', variant: 'default' as const },
  accepted: { label: 'Accettato', variant: 'success' as const },
  rejected: { label: 'Rifiutato', variant: 'danger' as const },
};

const ALL = 'all';
type Filter = 'all' | Quote['status'];

function formatEur(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function QuoteBuilderDashboard() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>(ALL);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [sendingQuote, setSendingQuote] = useState<QuoteWithClient | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const router = useRouter();
  const { data: accountId } = useEffectiveAccountId();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('quotes')
        .select('*, clients(name, company, email, phone)')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as QuoteWithClient[];
    },
    enabled: !!accountId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast('Preventivo eliminato');
      setDeletingId(null);
    },
    onError: () => toast('Errore durante l\'eliminazione', 'error'),
  });

  async function handleNew() {
    setCreating(true);
    try {
      if (!accountId) throw new Error('Account not ready');

      const { data: account } = await supabase
        .from('accounts')
        .select('quote_numbering_prefix, quote_numbering_counter, quote_numbering_digits, quote_validity_days')
        .eq('id', accountId)
        .single();

      const prefix = account?.quote_numbering_prefix ?? 'PRV';
      const counter = account?.quote_numbering_counter ?? 1;
      const digits = account?.quote_numbering_digits ?? 4;
      const validDays = account?.quote_validity_days ?? 30;
      const quoteNumber = `${prefix}-${counter.toString().padStart(digits, '0')}`;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validDays);
      const validUntilStr = validUntil.toISOString().split('T')[0];

      const { data: newQuote, error } = await supabase
        .from('quotes')
        .insert({
          account_id: accountId,
          title: 'Nuovo preventivo',
          status: 'draft',
          total_amount: 0,
          quote_number: quoteNumber,
          valid_until: validUntilStr,
        })
        .select('id')
        .single();

      if (error || !newQuote) throw error ?? new Error('Errore creazione');

      await supabase
        .from('accounts')
        .update({ quote_numbering_counter: counter + 1 })
        .eq('id', accountId);

      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      router.push(`/app/quotebuilder/${newQuote.id}`);
    } catch {
      toast('Errore durante la creazione', 'error');
      setCreating(false);
    }
  }

  async function handleDuplicate(quote: QuoteWithClient) {
    setDuplicatingId(quote.id);
    try {
      if (!accountId) throw new Error('Account not ready');

      const { data: account } = await supabase
        .from('accounts')
        .select('quote_numbering_prefix, quote_numbering_counter, quote_numbering_digits')
        .eq('id', accountId)
        .single();

      const prefix = account?.quote_numbering_prefix ?? 'PRV';
      const counter = account?.quote_numbering_counter ?? 1;
      const digits = account?.quote_numbering_digits ?? 4;
      const quoteNumber = `${prefix}-${counter.toString().padStart(digits, '0')}`;

      const { data: newQuote, error: qErr } = await supabase
        .from('quotes')
        .insert({
          account_id: accountId,
          client_id: quote.client_id,
          title: `${quote.title} (copia)`,
          status: 'draft',
          notes: quote.notes,
          total_amount: quote.total_amount,
          quote_number: quoteNumber,
        })
        .select('id')
        .single();

      if (qErr || !newQuote) throw qErr ?? new Error('Errore creazione preventivo');

      const { data: items } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quote.id)
        .order('sort_order');

      if (items && items.length > 0) {
        await supabase.from('quote_items').insert(
          items.map((item, idx) => ({
            quote_id: newQuote.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit: item.unit,
            sort_order: idx,
          }))
        );
      }

      await supabase
        .from('accounts')
        .update({ quote_numbering_counter: counter + 1 })
        .eq('id', accountId);

      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast(`Duplicato come ${quoteNumber}`, 'success');
      router.push(`/app/quotebuilder/${newQuote.id}`);
    } catch {
      toast('Errore durante la duplicazione', 'error');
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleMailtoOpened(quote: QuoteWithClient) {
    if (quote.status === 'draft') {
      await supabase.from('quotes').update({ status: 'sent' }).eq('id', quote.id);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    }
    toast('Email aperta — link valido 7 giorni', 'success');
  }

  const filtered = quotes.filter(q => {
    const matchesFilter = filter === ALL || q.status === filter;
    const term = search.toLowerCase();
    const matchesSearch =
      q.title.toLowerCase().includes(term) ||
      q.clients?.name.toLowerCase().includes(term) ||
      q.clients?.company?.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const accepted = quotes.filter(q => q.status === 'accepted').length;
  const pending = quotes.filter(q => q.status === 'sent').length;

  const filters: { value: Filter; label: string }[] = [
    { value: ALL, label: 'Tutti' },
    { value: 'draft', label: 'Bozze' },
    { value: 'sent', label: 'Inviati' },
    { value: 'accepted', label: 'Accettati' },
    { value: 'rejected', label: 'Rifiutati' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold -ml-0.5">Preventivi</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{quotes.length} preventivi totali</p>
        </div>
        <Button onClick={handleNew} disabled={creating}>
          <Plus className="w-4 h-4" />
          {creating ? 'Creazione...' : 'Nuovo preventivo'}
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Totale preventivi</p>
          <p className="text-2xl font-bold text-white mt-1">{quotes.length}</p>
        </div>
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Valore accettati</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {formatEur(quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total_amount, 0))}
          </p>
        </div>
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">In attesa · Accettati</p>
          <p className="text-2xl font-bold text-white mt-1">
            {pending} <span className="text-base font-normal text-zinc-600">·</span> {accepted}
          </p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cerca preventivo o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 h-9 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500 w-64"
          />
        </div>
        <div className="flex gap-1">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-white text-zinc-900'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-sm text-zinc-400">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || filter !== ALL ? 'Nessun risultato' : 'Nessun preventivo ancora'}
          description={search || filter !== ALL ? 'Prova a modificare i filtri.' : 'Crea il tuo primo preventivo.'}
          action={!search && filter === ALL ? (
            <Button onClick={handleNew} disabled={creating}>
              <Plus className="w-4 h-4" />
              {creating ? 'Creazione...' : 'Nuovo preventivo'}
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Titolo</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Validità</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Importo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(quote => {
                const sc = statusConfig[quote.status];
                const isDuplicating = duplicatingId === quote.id;
                return (
                  <tr key={quote.id} className="hover:bg-zinc-800/40 transition-colors group">
                    <td className="px-4 py-3 font-medium text-white">
                      <Link href={`/app/quotebuilder/${quote.id}`} className="hover:underline">
                        {quote.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {quote.clients ? (
                        <span>{quote.clients.company ?? quote.clients.name}</span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {quote.valid_until ? formatDate(quote.valid_until) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {formatEur(quote.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/app/quotebuilder/${quote.id}/anteprima`}
                          className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Anteprima"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setSendingQuote(quote)}
                          className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Invia al cliente"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/app/quotebuilder/${quote.id}`}
                          className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Modifica"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(quote)}
                          disabled={isDuplicating}
                          className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
                          title="Duplica"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(quote.id)}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Elimina preventivo"
        description="Questa azione è irreversibile. Il preventivo e tutte le sue voci verranno eliminati."
        loading={deleteMutation.isPending}
      />

      {sendingQuote && (
        <SendQuoteDialog
          open={true}
          onClose={() => setSendingQuote(null)}
          quoteId={sendingQuote.id}
          quoteLabel={sendingQuote.quote_number ?? sendingQuote.title}
          defaultEmail={sendingQuote.clients?.email ?? ''}
          defaultPhone={sendingQuote.clients?.phone ?? ''}
          onMailtoOpened={() => handleMailtoOpened(sendingQuote)}
        />
      )}
    </div>
  );
}
