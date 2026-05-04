'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient as supabaseClient } from '@/lib/supabase';
import { useAccount } from '@/hooks/useAccount';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePad } from '@/components/ui/signature-pad';

type Tab = 'numerazione' | 'pagamenti' | 'firma';

export default function QuoteBuilderImpostazioniView() {
  const { data: account, isLoading } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const [tab, setTab] = useState<Tab>('numerazione');
  const [signatureImage, setSignatureImage] = useState('');

  const [form, setForm] = useState({
    quote_numbering_prefix: 'PRE',
    quote_numbering_counter: '1',
    quote_numbering_digits: '4',
    quote_validity_days: '30',
    quote_payment_terms: '',
    quote_signature_role: '',
  });

  useEffect(() => {
    if (account) {
      setForm({
        quote_numbering_prefix: account.quote_numbering_prefix ?? 'PRE',
        quote_numbering_counter: String(account.quote_numbering_counter ?? 1),
        quote_numbering_digits: String(account.quote_numbering_digits ?? 4),
        quote_validity_days: String(account.quote_validity_days ?? 30),
        quote_payment_terms: account.quote_payment_terms ?? '',
        quote_signature_role: account.quote_signature_role ?? '',
      });
      setSignatureImage((account as Record<string, unknown>).quote_signature_image as string ?? '');
    }
  }, [account]);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const payload = {
        quote_numbering_prefix: form.quote_numbering_prefix || 'PRE',
        quote_numbering_counter: parseInt(form.quote_numbering_counter) || 1,
        quote_numbering_digits: parseInt(form.quote_numbering_digits) || 4,
        quote_validity_days: parseInt(form.quote_validity_days) || 30,
        quote_payment_terms: form.quote_payment_terms || null,
        quote_signature_role: form.quote_signature_role || null,
        quote_signature_image: signatureImage || null,
      };
      const { error } = await supabase.from('accounts').update(payload).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
      toast('Impostazioni salvate', 'success');
    },
    onError: (err: Error) => toast(err.message || 'Errore durante il salvataggio', 'error'),
  });

  const previewFormatted = `${form.quote_numbering_prefix}-${String(form.quote_numbering_counter).padStart(parseInt(form.quote_numbering_digits) || 4, '0')}`;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'numerazione', label: 'Numerazione' },
    { id: 'pagamenti', label: 'Pagamenti' },
    { id: 'firma', label: 'Firma' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold -ml-0.5">Impostazioni QuoteBuilder</h1>
        <p className="text-sm text-zinc-400 mt-1">Configurazione numerazione, pagamenti e firma preventivi.</p>
      </div>

      {/* Tab switcher */}
      <div className="bg-zinc-100 rounded-lg p-1 flex gap-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all duration-150 ${
              tab === t.id
                ? 'bg-white shadow-sm text-white'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-[#09090b] border border-white/10 rounded-lg divide-y divide-zinc-100">
        {tab === 'numerazione' && (
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Numerazione automatica</h2>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Prefisso</label>
                <Input value={form.quote_numbering_prefix} onChange={e => set('quote_numbering_prefix', e.target.value)} placeholder="PRE" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Prossimo numero</label>
                <Input type="number" min="1" value={form.quote_numbering_counter} onChange={e => set('quote_numbering_counter', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Cifre (es. 4 → 0001)</label>
                <Input type="number" min="1" max="8" value={form.quote_numbering_digits} onChange={e => set('quote_numbering_digits', e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Anteprima: <span className="font-mono font-semibold text-zinc-700">{previewFormatted}</span>
            </p>
            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-600 mb-1">Validità preventivo (giorni)</label>
              <div className="max-w-xs">
                <Input type="number" min="1" value={form.quote_validity_days} onChange={e => set('quote_validity_days', e.target.value)} />
              </div>
              <p className="text-xs text-zinc-400 mt-1">Usato per calcolare automaticamente la data di scadenza.</p>
            </div>
          </div>
        )}

        {tab === 'pagamenti' && (
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Condizioni di pagamento</h2>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Testo condizioni</label>
              <Textarea
                value={form.quote_payment_terms}
                onChange={e => set('quote_payment_terms', e.target.value)}
                placeholder="es. Pagamento a 30 giorni dalla data di fattura. 50% all'accettazione, 50% alla consegna."
                rows={5}
              />
              <p className="text-xs text-zinc-400 mt-1">Appare in fondo al preventivo stampato/esportato.</p>
            </div>
          </div>
        )}

        {tab === 'firma' && (
          <div className="px-6 py-5 space-y-5">
            <div>
              <h2 className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wide">Firma digitale</h2>
              <p className="text-xs text-zinc-500 mb-3">Disegna la tua firma. Apparirà in fondo al preventivo sopra la riga di firma.</p>
              <SignaturePad
                value={signatureImage}
                onChange={setSignatureImage}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Ruolo / Titolo</label>
              <Input
                value={form.quote_signature_role}
                onChange={e => set('quote_signature_role', e.target.value)}
                placeholder="CEO, Direttore Commerciale..."
              />
              <p className="text-xs text-zinc-500 mt-1">Appare sotto la firma nel preventivo.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva impostazioni'}
        </Button>
      </div>
    </div>
  );
}
