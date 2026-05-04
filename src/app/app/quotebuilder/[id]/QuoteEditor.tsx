'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Save, Eye, Copy, LayoutList, Layers, Search, ChevronDown, ChevronUp, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Quote, QuoteItem, Client, TemplateServizio, BundleProgetto } from '@/lib/types';
import { SendQuoteDialog } from '@/components/SendQuoteDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';

type FullQuote = Quote & {
  quote_items: QuoteItem[];
};

type BundleWithItems = BundleProgetto & {
  bundle_items: { order_position: number; template_servizi: TemplateServizio }[];
};

type LineItem = {
  id?: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  unit: string;
};

const statusConfig = {
  draft: { label: 'Bozza', variant: 'secondary' as const },
  sent: { label: 'Inviato', variant: 'default' as const },
  accepted: { label: 'Accettato', variant: 'success' as const },
  rejected: { label: 'Rifiutato', variant: 'danger' as const },
};

function formatEur(n: number) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

interface QuoteEditorProps {
  quoteId: string;
}

export function QuoteEditor({ quoteId }: QuoteEditorProps) {
  const supabase = supabaseClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();
  const { data: accountId } = useEffectiveAccountId();

  const [items, setItems] = useState<LineItem[]>([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'servizi' | 'bundle'>('servizi');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Editable quote fields
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [status, setStatus] = useState<Quote['status']>('draft');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [showIva, setShowIva] = useState(false);
  const [ivaPercent, setIvaPercent] = useState(22);
  const [logoUrl, setLogoUrl] = useState('');

  const { data: quote, isLoading, error: quoteError } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, quote_items(*)')
        .eq('id', quoteId)
        .single();
      if (error) {
        console.error('[QuoteEditor] fetch error:', error.code, error.message, error.details);
        throw error;
      }
      return data as FullQuote;
    },
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await supabase
        .from('clients')
        .select('id, name, company, email')
        .eq('account_id', accountId)
        .order('name');
      return (data ?? []) as Pick<Client, 'id' | 'name' | 'company' | 'email'>[];
    },
    enabled: !!accountId,
  });

  const { data: servizi = [] } = useQuery({
    queryKey: ['template_servizi_editor'],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await supabase
        .from('template_servizi')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('name');
      return (data ?? []) as TemplateServizio[];
    },
    enabled: !!accountId,
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['bundle_progetti_editor'],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await supabase
        .from('bundle_progetti')
        .select('*, bundle_items(order_position, template_servizi(*))')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .order('name');
      return (data ?? []) as BundleWithItems[];
    },
    enabled: !!accountId,
  });

  const { data: accountLogo } = useQuery({
    queryKey: ['account_logo'],
    queryFn: async () => {
      if (!accountId) return null;
      const { data } = await supabase
        .from('accounts')
        .select('logo_url')
        .eq('id', accountId)
        .single();
      return data?.logo_url ?? null;
    },
    enabled: !!accountId,
  });

  useEffect(() => {
    if (quote && !itemsLoaded) {
      const sorted = [...quote.quote_items].sort((a, b) => a.sort_order - b.sort_order);
      setItems(sorted.map(i => ({
        id: i.id,
        name: i.name ?? '',
        description: i.description,
        quantity: i.quantity,
        unit_price: i.unit_price,
        unit: i.unit ?? 'servizio',
      })));
      setTitle(quote.title);
      setClientId(quote.client_id ?? '');
      setStatus(quote.status);
      setValidUntil(quote.valid_until ?? '');
      setNotes(quote.notes ?? '');
      setShowIva(quote.show_iva ?? false);
      setIvaPercent(quote.iva_percent ?? 22);
      setLogoUrl(quote.logo_url ?? '');
      setItemsLoaded(true);
    }
  }, [quote, itemsLoaded]);

  const addItem = () => {
    setItems(prev => [...prev, { name: '', description: '', quantity: 1, unit_price: 0, unit: 'servizio' }]);
  };

  const addFromServizio = (s: TemplateServizio) => {
    setItems(prev => [...prev, {
      name: s.name,
      description: s.description ?? '',
      quantity: 1,
      unit_price: s.price,
      unit: s.unit,
    }]);
    toast(`"${s.name}" aggiunto`);
  };

  const addFromBundle = (b: BundleWithItems) => {
    const sorted = [...b.bundle_items].sort((a, b) => a.order_position - b.order_position);
    const newItems = sorted.map(bi => ({
      name: bi.template_servizi.name,
      description: bi.template_servizi.description ?? '',
      quantity: 1,
      unit_price: bi.template_servizi.price,
      unit: bi.template_servizi.unit,
    }));
    setItems(prev => [...prev, ...newItems]);
    toast(`Bundle "${b.name}": ${newItems.length} righe aggiunte`);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const imponibile = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const ivaAmount = showIva ? imponibile * ivaPercent / 100 : 0;
  const totale = imponibile + ivaAmount;

  async function handleSave() {
    if (!quote) return;
    setSaving(true);
    try {
      await supabase.from('quote_items').delete().eq('quote_id', quoteId);

      if (items.length > 0) {
        const { error } = await supabase.from('quote_items').insert(
          items.map((item, idx) => ({
            quote_id: quoteId,
            name: item.name || null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            unit: item.unit,
            sort_order: idx,
          }))
        );
        if (error) throw error;
      }

      const { error: qErr } = await supabase.from('quotes').update({
        title: title.trim() || 'Preventivo',
        client_id: clientId || null,
        status,
        valid_until: validUntil || null,
        notes: notes || null,
        show_iva: showIva,
        iva_percent: ivaPercent,
        logo_url: logoUrl || null,
        total_amount: totale,
      }).eq('id', quoteId);

      if (qErr) throw qErr;

      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      setItemsLoaded(false);
      toast('Preventivo salvato', 'success');
    } catch {
      toast('Errore durante il salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleMailtoOpened() {
    if (status === 'draft') {
      await supabase.from('quotes').update({ status: 'sent' }).eq('id', quoteId);
      setStatus('sent');
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    }
    toast('Email aperta — link valido 7 giorni', 'success');
  }

  async function handleDuplicate() {
    if (!quote || !accountId) return;
    setDuplicating(true);
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select('quote_numbering_prefix, quote_numbering_counter, quote_numbering_digits')
        .eq('id', accountId)
        .single();

      const prefix = account?.quote_numbering_prefix ?? 'PRE';
      const counter = account?.quote_numbering_counter ?? 1;
      const digits = account?.quote_numbering_digits ?? 4;
      const quoteNumber = `${prefix}-${counter.toString().padStart(digits, '0')}`;

      const { data: newQuote, error: qErr } = await supabase
        .from('quotes')
        .insert({
          account_id: accountId,
          client_id: clientId || null,
          title: `${title} (copia)`,
          status: 'draft',
          notes: notes || null,
          total_amount: totale,
          quote_number: quoteNumber,
          show_iva: showIva,
          iva_percent: ivaPercent,
          logo_url: logoUrl || null,
        })
        .select('id')
        .single();

      if (qErr || !newQuote) throw qErr ?? new Error('Errore creazione preventivo');

      if (items.length > 0) {
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
      setDuplicating(false);
    }
  }

  const filteredServizi = servizi.filter(s =>
    s.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (s.description ?? '').toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const filteredBundles = bundles.filter(b =>
    b.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-zinc-500">Caricamento...</div>;
  }

  if (!quote) {
    const errCode = (quoteError as { code?: string } | null)?.code;
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-sm text-red-400">
          Preventivo non trovato.{errCode ? ` (${errCode})` : ''}
        </p>
        <Link href="/app/quotebuilder" className="text-sm text-zinc-400 hover:text-zinc-200 mt-2 inline-block transition-colors">
          ← Torna ai preventivi
        </Link>
      </div>
    );
  }

  const sc = statusConfig[status];
  const activeLogoUrl = logoUrl || accountLogo;

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Link
                href="/app/quotebuilder"
                className="mt-2 p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Titolo preventivo"
                    className="text-2xl font-bold bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-zinc-500 focus:outline-none text-white placeholder:text-zinc-600 transition-colors min-w-0 w-full max-w-sm"
                  />
                  {quote.quote_number && (
                    <span className="text-sm text-zinc-500 font-mono shrink-0">{quote.quote_number}</span>
                  )}
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as Quote['status'])}
                className="h-9 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                <option value="draft">Bozza</option>
                <option value="sent">Inviato</option>
                <option value="accepted">Accettato</option>
                <option value="rejected">Rifiutato</option>
              </select>
              <Link
                href={`/app/quotebuilder/${quoteId}/anteprima`}
                className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Anteprima
              </Link>
              <button
                onClick={() => setShowSendDialog(true)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-600 bg-zinc-800 text-sm text-zinc-200 hover:text-white hover:bg-zinc-700 hover:border-zinc-500 transition-colors"
              >
                <Send className="w-4 h-4" />
                Invia al cliente
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating}
                className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                {duplicating ? 'Duplicazione...' : 'Duplica'}
              </button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? 'Salvataggio...' : 'Salva'}
              </Button>
            </div>
          </div>

          {/* Quote details panel */}
          <div className="bg-[#09090b] border border-white/10 rounded-lg mb-6">
            <button
              onClick={() => setShowDetails(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <span>Dettagli preventivo</span>
              {showDetails ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>

            {showDetails && (
              <div className="border-t border-zinc-800 px-5 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Cliente */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Cliente</label>
                    <select
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      <option value="">Nessun cliente</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.company ? `${c.company} – ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Validità */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Valido fino al</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Note interne</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Note interne o per il cliente..."
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Logo */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Logo preventivo</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Carica logo
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="sr-only"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 1024 * 1024) {
                                toast('Il file supera 1 MB', 'error');
                                e.target.value = '';
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = ev => setLogoUrl(ev.target?.result as string);
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        {accountLogo && !logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl(accountLogo)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            Usa logo azienda
                          </button>
                        )}
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            Rimuovi
                          </button>
                        )}
                      </div>
                      {activeLogoUrl && (
                        <div className="p-2 rounded border border-zinc-700 bg-zinc-800 inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={activeLogoUrl} alt="Logo" className="h-8 object-contain max-w-[120px]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* IVA */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">IVA</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showIva}
                          onChange={e => setShowIva(e.target.checked)}
                          className="accent-zinc-400 w-4 h-4"
                        />
                        <span className="text-sm text-zinc-300">Mostra IVA nel preventivo</span>
                      </label>
                      {showIva && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={ivaPercent}
                            onChange={e => setIvaPercent(parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-white/20"
                          />
                          <span className="text-sm text-zinc-400">%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300">Voci preventivo</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-white hover:text-zinc-300 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Aggiungi voce
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12 text-sm text-zinc-500">
                <p>Nessuna voce ancora.</p>
                <button
                  onClick={addItem}
                  className="mt-3 text-white hover:text-zinc-300 font-medium transition-colors"
                >
                  + Aggiungi la prima voce
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-zinc-800">
                  <div className="grid grid-cols-[1fr_1fr_80px_110px_90px_32px] gap-2 px-4 py-2 bg-zinc-900/50 border-b border-zinc-800">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Nome</span>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Descrizione</span>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide text-center">Qtà</span>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide text-right">Prezzo unit.</span>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide text-right">Totale</span>
                    <div />
                  </div>
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_1fr_80px_110px_90px_32px] gap-2 items-center px-4 py-2"
                    >
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItem(idx, 'name', e.target.value)}
                        placeholder="Titolo servizio"
                        className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        placeholder="Descrizione..."
                        className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full h-8 rounded-md border border-zinc-700 bg-zinc-800 px-2 text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-zinc-500"
                      />
                      <div className="text-sm font-medium text-white text-right pr-1">
                        {formatEur(item.quantity * item.unit_price)}
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-zinc-800 bg-zinc-900/50 px-4 py-4">
                  <div className="flex justify-end">
                    <div className="space-y-1 min-w-[220px]">
                      <div className="flex justify-between text-sm text-zinc-400">
                        <span>Imponibile</span>
                        <span>{formatEur(imponibile)}</span>
                      </div>
                      {showIva && (
                        <div className="flex justify-between text-sm text-zinc-400">
                          <span>IVA {ivaPercent}%</span>
                          <span>{formatEur(ivaAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold text-white border-t border-zinc-700 pt-2 mt-2">
                        <span>Totale</span>
                        <span>{formatEur(totale)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom save */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Salvataggio...' : 'Salva preventivo'}
            </Button>
          </div>
        </div>
      </div>

      <SendQuoteDialog
        open={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        quoteId={quoteId}
        quoteLabel={quote.quote_number ?? quote.title}
        defaultEmail={clients.find(c => c.id === clientId)?.email ?? ''}
        defaultPhone={clients.find(c => c.id === clientId)?.phone ?? ''}
        onMailtoOpened={handleMailtoOpened}
      />

      {/* Right sidebar — catalogo */}
      <div className="w-72 shrink-0 border-l border-white/10 bg-[#09090b] flex flex-col overflow-hidden">
        {/* Tab switcher */}
        <div className="px-3 pt-4 pb-0">
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setCatalogTab('servizi')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                catalogTab === 'servizi'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Servizi
            </button>
            <button
              onClick={() => setCatalogTab('bundle')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                catalogTab === 'bundle'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Bundle
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Cerca..."
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              className="w-full pl-8 pr-3 h-8 rounded-md border border-zinc-700 bg-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
        </div>

        <p className="px-3 pt-1 pb-2 text-xs text-zinc-600">
          {catalogTab === 'servizi' ? 'Click per aggiungere al preventivo.' : 'Click per aggiungere tutte le righe del bundle.'}
        </p>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {catalogTab === 'servizi' ? (
            filteredServizi.length === 0 ? (
              <p className="text-xs text-zinc-600 px-2 py-3">
                {servizi.length === 0 ? 'Nessun servizio template attivo.' : 'Nessun risultato.'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredServizi.map(s => (
                  <button
                    key={s.id}
                    onClick={() => addFromServizio(s)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors leading-tight">{s.name}</p>
                        {s.description && (
                          <p className="text-xs text-zinc-600 mt-0.5 truncate">{s.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 tabular-nums shrink-0 pt-0.5">{formatEur(s.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            filteredBundles.length === 0 ? (
              <p className="text-xs text-zinc-600 px-2 py-3">
                {bundles.length === 0 ? 'Nessun bundle attivo.' : 'Nessun risultato.'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredBundles.map(b => {
                  const sorted = [...b.bundle_items].sort((a, c) => a.order_position - c.order_position);
                  const bundleTotal = sorted.reduce((s, bi) => s + bi.template_servizi.price, 0);
                  return (
                    <button
                      key={b.id}
                      onClick={() => addFromBundle(b)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors leading-tight">{b.name}</p>
                          <p className="text-xs text-zinc-600 mt-0.5">{sorted.length} servizi</p>
                        </div>
                        <span className="text-xs text-zinc-500 tabular-nums shrink-0 pt-0.5">{formatEur(bundleTotal)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
