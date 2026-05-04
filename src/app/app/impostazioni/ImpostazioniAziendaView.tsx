'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Info, X } from 'lucide-react';
import { createClient as supabaseClient } from '@/lib/supabase';
import { useAccount } from '@/hooks/useAccount';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePad } from '@/components/ui/signature-pad';

type Tab = 'azienda' | 'numerazione' | 'pagamenti' | 'stile_pdf' | 'firma';

type PaymentMethod = { name: string; iban: string; details: string };

type QuoteSections = {
  header_azienda: boolean;
  box_cliente: boolean;
  box_totali: boolean;
  footer: boolean;
  note_servizi: boolean;
  titolo_preventivo: boolean;
  allegato_tecnico: boolean;
  firma: boolean;
};

export default function ImpostazioniAziendaView() {
  const { data: account, isLoading } = useAccount();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = supabaseClient();
  const [tab, setTab] = useState<Tab>('azienda');
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [sediList, setSediList] = useState<string[]>([]);
  const [newSede, setNewSede] = useState('');

  const [azienda, setAziendaState] = useState({
    company_name: '',
    ragione_sociale: '',
    partita_iva: '',
    codice_fiscale: '',
    address: '',
    cap: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    hourly_cost: '',
  });

  const [numerazione, setNumerazioneState] = useState({
    quote_numbering_prefix: 'PRV',
    quote_numbering_counter: '1',
    quote_numbering_digits: '4',
    quote_validity_days: '30',
  });

  const [pagamenti, setPagamentiState] = useState({
    quote_payment_terms: '',
    quote_payment_methods: [] as PaymentMethod[],
  });

  const [stilePdf, setStilePdfState] = useState({
    logo_url: '',
    quote_color_primary: '#09090b',
    quote_color_text: '#09090b',
    quote_color_secondary: '#71717a',
    quote_font_size_base: '10',
    quote_font_size_service: '9',
    quote_font_size_price: '9',
    quote_margin_top: '20',
    quote_margin_right: '20',
    quote_margin_bottom: '20',
    quote_margin_left: '20',
    quote_sections: {
      header_azienda: true,
      box_cliente: true,
      box_totali: true,
      footer: true,
      note_servizi: true,
      titolo_preventivo: true,
      allegato_tecnico: false,
      firma: true,
    } as QuoteSections,
  });

  const [firma, setFirmaState] = useState({
    quote_signature_name: '',
    quote_signature_role: '',
    quote_signature_image: '',
  });

  useEffect(() => {
    if (account) {
      setAziendaState({
        company_name: account.company_name ?? '',
        ragione_sociale: account.ragione_sociale ?? '',
        partita_iva: account.partita_iva ?? '',
        codice_fiscale: account.codice_fiscale ?? '',
        address: account.address ?? '',
        cap: account.cap ?? '',
        city: account.city ?? '',
        phone: account.phone ?? '',
        email: account.email ?? '',
        website: account.website ?? '',
        hourly_cost: account.hourly_cost != null ? String(account.hourly_cost) : '',
      });
      setNumerazioneState({
        quote_numbering_prefix: account.quote_numbering_prefix ?? 'PRV',
        quote_numbering_counter: String(account.quote_numbering_counter ?? 1),
        quote_numbering_digits: String(account.quote_numbering_digits ?? 4),
        quote_validity_days: String(account.quote_validity_days ?? 30),
      });
      const methods = Array.isArray(account.quote_payment_methods)
        ? (account.quote_payment_methods as PaymentMethod[]).map(m => ({
            name: m.name ?? '',
            iban: m.iban ?? '',
            details: m.details ?? '',
          }))
        : [];
      setPagamentiState({
        quote_payment_terms: account.quote_payment_terms ?? '',
        quote_payment_methods: methods,
      });
      setStilePdfState({
        logo_url: account.logo_url ?? '',
        quote_color_primary: account.quote_color_primary ?? '#09090b',
        quote_color_text: account.quote_color_text ?? '#09090b',
        quote_color_secondary: account.quote_color_secondary ?? '#71717a',
        quote_font_size_base: String(account.quote_font_size_base ?? 10),
        quote_font_size_service: String(account.quote_font_size_service ?? 9),
        quote_font_size_price: String(account.quote_font_size_price ?? 9),
        quote_margin_top: String(account.quote_margin_top ?? 20),
        quote_margin_right: String(account.quote_margin_right ?? 20),
        quote_margin_bottom: String(account.quote_margin_bottom ?? 20),
        quote_margin_left: String(account.quote_margin_left ?? 20),
        quote_sections: account.quote_sections ?? {
          header_azienda: true,
          box_cliente: true,
          box_totali: true,
          footer: true,
          note_servizi: true,
          titolo_preventivo: true,
          allegato_tecnico: false,
          firma: true,
        },
      });
      setFirmaState({
        quote_signature_name: account.quote_signature_name ?? '',
        quote_signature_role: account.quote_signature_role ?? '',
        quote_signature_image: (account as Record<string, unknown>).quote_signature_image as string ?? '',
      });
      setSediList(Array.isArray(account.sedi) ? account.sedi : []);
    }
  }, [account]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let error;
      if (tab === 'azienda') {
        ({ error } = await supabase.from('accounts').update({
          company_name: azienda.company_name || null,
          ragione_sociale: azienda.ragione_sociale || null,
          partita_iva: azienda.partita_iva || null,
          codice_fiscale: azienda.codice_fiscale || null,
          address: azienda.address || null,
          cap: azienda.cap || null,
          city: azienda.city || null,
          phone: azienda.phone || null,
          email: azienda.email || undefined,
          website: azienda.website || null,
          hourly_cost: azienda.hourly_cost ? parseFloat(azienda.hourly_cost) : 0,
          sedi: sediList,
        }).eq('id', user.id));
      } else if (tab === 'numerazione') {
        ({ error } = await supabase.from('accounts').update({
          quote_numbering_prefix: numerazione.quote_numbering_prefix || 'PRV',
          quote_numbering_counter: parseInt(numerazione.quote_numbering_counter) || 1,
          quote_numbering_digits: parseInt(numerazione.quote_numbering_digits) || 4,
          quote_validity_days: parseInt(numerazione.quote_validity_days) || 30,
        }).eq('id', user.id));
      } else if (tab === 'pagamenti') {
        ({ error } = await supabase.from('accounts').update({
          quote_payment_terms: pagamenti.quote_payment_terms || null,
          quote_payment_methods: pagamenti.quote_payment_methods,
        }).eq('id', user.id));
      } else if (tab === 'stile_pdf') {
        ({ error } = await supabase.from('accounts').update({
          logo_url: stilePdf.logo_url || null,
          quote_color_primary: stilePdf.quote_color_primary || '#09090b',
          quote_color_text: stilePdf.quote_color_text || '#09090b',
          quote_color_secondary: stilePdf.quote_color_secondary || '#71717a',
          quote_font_size_base: parseFloat(stilePdf.quote_font_size_base) || 10,
          quote_font_size_service: parseFloat(stilePdf.quote_font_size_service) || 9,
          quote_font_size_price: parseFloat(stilePdf.quote_font_size_price) || 9,
          quote_margin_top: parseFloat(stilePdf.quote_margin_top) || 20,
          quote_margin_right: parseFloat(stilePdf.quote_margin_right) || 20,
          quote_margin_bottom: parseFloat(stilePdf.quote_margin_bottom) || 20,
          quote_margin_left: parseFloat(stilePdf.quote_margin_left) || 20,
          quote_sections: stilePdf.quote_sections,
        }).eq('id', user.id));
      } else if (tab === 'firma') {
        ({ error } = await supabase.from('accounts').update({
          quote_signature_name: firma.quote_signature_name || null,
          quote_signature_role: firma.quote_signature_role || null,
          quote_signature_image: firma.quote_signature_image || null,
        }).eq('id', user.id));
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] });
      toast('Impostazioni salvate', 'success');
    },
    onError: (err: Error) => toast(err.message || 'Errore durante il salvataggio', 'error'),
  });

  const setA = (field: string, value: string) =>
    setAziendaState(prev => ({ ...prev, [field]: value }));
  const setN = (field: string, value: string) =>
    setNumerazioneState(prev => ({ ...prev, [field]: value }));
  const setS = (field: string, value: string) =>
    setStilePdfState(prev => ({ ...prev, [field]: value }));

  const previewFormatted = `${numerazione.quote_numbering_prefix}-${String(numerazione.quote_numbering_counter).padStart(parseInt(numerazione.quote_numbering_digits) || 4, '0')}`;

  function addPaymentMethod() {
    setPagamentiState(prev => ({
      ...prev,
      quote_payment_methods: [...prev.quote_payment_methods, { name: '', iban: '', details: '' }],
    }));
  }

  function removePaymentMethod(idx: number) {
    setPagamentiState(prev => ({
      ...prev,
      quote_payment_methods: prev.quote_payment_methods.filter((_, i) => i !== idx),
    }));
  }

  function updatePaymentMethod(idx: number, field: keyof PaymentMethod, value: string) {
    setPagamentiState(prev => ({
      ...prev,
      quote_payment_methods: prev.quote_payment_methods.map((m, i) =>
        i === idx ? { ...m, [field]: value } : m
      ),
    }));
  }

  function addSede() {
    const trimmed = newSede.trim();
    if (!trimmed || sediList.includes(trimmed)) return;
    setSediList(prev => [...prev, trimmed]);
    setNewSede('');
  }

  function removeSede(sede: string) {
    setSediList(prev => prev.filter(s => s !== sede));
  }

  function toggleSection(key: keyof QuoteSections) {
    setStilePdfState(prev => ({
      ...prev,
      quote_sections: { ...prev.quote_sections, [key]: !prev.quote_sections[key] },
    }));
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'azienda', label: 'Dati Azienda' },
    { id: 'numerazione', label: 'Numerazione' },
    { id: 'pagamenti', label: 'Pagamenti' },
    { id: 'stile_pdf', label: 'Stile PDF' },
    { id: 'firma', label: 'Firma' },
  ];

  const sectionLabels: Record<keyof QuoteSections, string> = {
    header_azienda: 'Intestazione azienda',
    box_cliente: 'Box cliente',
    box_totali: 'Box totali',
    footer: 'Footer (pagamenti)',
    note_servizi: 'Note servizi',
    titolo_preventivo: 'Titolo preventivo',
    allegato_tecnico: 'Allegato tecnico',
    firma: 'Firma',
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-56 bg-zinc-200 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-zinc-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold -ml-0.5">Impostazioni</h1>
        <p className="text-sm text-zinc-400 mt-1">Dati azienda e configurazione preventivi.</p>
      </div>

      {/* Tab switcher */}
      <div className="bg-zinc-100 rounded-lg p-1 flex gap-1 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-all duration-150 ${
              tab === t.id
                ? 'bg-white shadow-sm text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'azienda' && (
        <div className="bg-[#09090b] border border-white/10 rounded-lg divide-y divide-zinc-800">
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Dati Azienda</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Nome Azienda</label>
                  <Input value={azienda.company_name} onChange={e => setA('company_name', e.target.value)} placeholder="es. Clientivo S.r.l." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Ragione Sociale</label>
                  <Input value={azienda.ragione_sociale} onChange={e => setA('ragione_sociale', e.target.value)} placeholder="Ragione sociale completa" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Partita IVA</label>
                  <Input value={azienda.partita_iva} onChange={e => setA('partita_iva', e.target.value)} placeholder="IT12345678901" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Codice Fiscale</label>
                  <Input value={azienda.codice_fiscale} onChange={e => setA('codice_fiscale', e.target.value)} placeholder="Codice fiscale" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Indirizzo</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Indirizzo</label>
                <Input value={azienda.address} onChange={e => setA('address', e.target.value)} placeholder="Via Roma 1" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">CAP</label>
                  <Input value={azienda.cap} onChange={e => setA('cap', e.target.value)} placeholder="20100" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Città</label>
                  <Input value={azienda.city} onChange={e => setA('city', e.target.value)} placeholder="Milano" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Contatti</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Telefono</label>
                <Input value={azienda.phone} onChange={e => setA('phone', e.target.value)} placeholder="+39 02 1234567" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                <Input type="email" value={azienda.email} onChange={e => setA('email', e.target.value)} placeholder="info@azienda.com" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Sito Web</label>
                <Input value={azienda.website} onChange={e => setA('website', e.target.value)} placeholder="https://clientivo.com" />
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Sedi</h2>
              <span className="text-xs text-zinc-600">Usate nei form clienti, pacchetti e fornitori</span>
            </div>
            <div className="space-y-2 mb-3">
              {sediList.length === 0 && (
                <p className="text-xs text-zinc-600 italic">Nessuna sede configurata.</p>
              )}
              {sediList.map(sede => (
                <div key={sede} className="flex items-center justify-between px-3 py-2 rounded border border-zinc-700 bg-zinc-800/50">
                  <span className="text-sm text-zinc-300">{sede}</span>
                  <button
                    type="button"
                    onClick={() => removeSede(sede)}
                    className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 h-9 px-3 rounded border border-zinc-700 bg-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                value={newSede}
                onChange={e => setNewSede(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSede())}
                placeholder="Es. Milano"
              />
              <button
                type="button"
                onClick={addSede}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Aggiungi
              </button>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Costi Interni (OneDigit)</h2>
              <button
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
                title="Mostra formule di calcolo margine"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Costo Orario Interno (€/ora)</label>
              <Input
                type="number" min="0" step="0.01"
                value={azienda.hourly_cost}
                onChange={e => setA('hourly_cost', e.target.value)}
                placeholder="es. 35"
              />
              <p className="text-xs text-zinc-500 mt-1">Usato per calcolare il Costo Coordinamento nel margine netto.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'numerazione' && (
        <div className="bg-[#09090b] border border-white/10 rounded-lg divide-y divide-zinc-800">
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Numerazione automatica</h2>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Prefisso</label>
                <Input value={numerazione.quote_numbering_prefix} onChange={e => setN('quote_numbering_prefix', e.target.value)} placeholder="PRV" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Prossimo numero</label>
                <Input type="number" min="1" value={numerazione.quote_numbering_counter} onChange={e => setN('quote_numbering_counter', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Cifre (es. 4 → 0001)</label>
                <Input type="number" min="1" max="8" value={numerazione.quote_numbering_digits} onChange={e => setN('quote_numbering_digits', e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Anteprima: <span className="font-mono font-semibold text-zinc-300">{previewFormatted}</span>
            </p>
          </div>
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Validità</h2>
            <div className="max-w-xs">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Validità preventivo (giorni)</label>
              <Input type="number" min="1" value={numerazione.quote_validity_days} onChange={e => setN('quote_validity_days', e.target.value)} />
              <p className="text-xs text-zinc-500 mt-1">Usato per calcolare automaticamente la data di scadenza.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'pagamenti' && (
        <div className="bg-[#09090b] border border-white/10 rounded-lg divide-y divide-zinc-800">
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Condizioni di pagamento</h2>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Testo condizioni</label>
              <Textarea
                value={pagamenti.quote_payment_terms}
                onChange={e => setPagamentiState(prev => ({ ...prev, quote_payment_terms: e.target.value }))}
                placeholder="es. Pagamento a 30 giorni dalla data di fattura. 50% all'accettazione, 50% alla consegna."
                rows={4}
              />
              <p className="text-xs text-zinc-500 mt-1">Appare in fondo al preventivo stampato/esportato.</p>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Metodi di pagamento</h2>
              <button
                type="button"
                onClick={addPaymentMethod}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Aggiungi
              </button>
            </div>
            {pagamenti.quote_payment_methods.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">Nessun metodo di pagamento configurato.</p>
            ) : (
              <div className="space-y-4">
                {pagamenti.quote_payment_methods.map((method, idx) => (
                  <div key={idx} className="relative rounded-lg border border-zinc-700 p-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => removePaymentMethod(idx)}
                      className="absolute top-3 right-3 p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Nome metodo</label>
                      <Input
                        value={method.name}
                        onChange={e => updatePaymentMethod(idx, 'name', e.target.value)}
                        placeholder="es. Bonifico bancario"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">IBAN</label>
                      <Input
                        value={method.iban}
                        onChange={e => updatePaymentMethod(idx, 'iban', e.target.value)}
                        placeholder="IT60 X054 2811 1010 0000 0123 456"
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Dettagli aggiuntivi</label>
                      <Input
                        value={method.details}
                        onChange={e => updatePaymentMethod(idx, 'details', e.target.value)}
                        placeholder="es. Intestato a Mario Rossi"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'stile_pdf' && (
        <div className="bg-[#09090b] border border-white/10 rounded-lg divide-y divide-zinc-800">
          {/* Logo */}
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Logo aziendale</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Carica immagine</label>
                <label className="flex items-center gap-3 cursor-pointer w-fit">
                  <span className="flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-700 bg-zinc-800 text-sm text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Scegli file
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 1024 * 1024) {
                        toast('Il file supera 1 MB. Scegli un\'immagine più piccola.', 'error');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = ev => {
                        setStilePdfState(prev => ({ ...prev, logo_url: ev.target?.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                <p className="text-xs text-zinc-500 mt-1.5">PNG, JPG o WebP · max 1 MB. Apparirà nell'intestazione del preventivo.</p>
              </div>
              {stilePdf.logo_url && (
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded border border-zinc-700 bg-zinc-800 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={stilePdf.logo_url} alt="Logo anteprima" className="h-10 object-contain max-w-[160px]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setStilePdfState(prev => ({ ...prev, logo_url: '' }))}
                    className="mt-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Rimuovi logo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Colori */}
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Colori</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Colore primario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stilePdf.quote_color_primary}
                    onChange={e => setS('quote_color_primary', e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                  />
                  <Input
                    value={stilePdf.quote_color_primary}
                    onChange={e => setS('quote_color_primary', e.target.value)}
                    placeholder="#09090b"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Testo principale</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stilePdf.quote_color_text}
                    onChange={e => setS('quote_color_text', e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                  />
                  <Input
                    value={stilePdf.quote_color_text}
                    onChange={e => setS('quote_color_text', e.target.value)}
                    placeholder="#09090b"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Testo secondario</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={stilePdf.quote_color_secondary}
                    onChange={e => setS('quote_color_secondary', e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                  />
                  <Input
                    value={stilePdf.quote_color_secondary}
                    onChange={e => setS('quote_color_secondary', e.target.value)}
                    placeholder="#71717a"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font sizes */}
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Dimensioni testo (pt)</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Testo base</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="7" max="16" step="0.5"
                    value={stilePdf.quote_font_size_base}
                    onChange={e => setS('quote_font_size_base', e.target.value)}
                    className="flex-1 accent-zinc-400"
                  />
                  <span className="text-xs font-mono text-zinc-300 w-8 text-right">{stilePdf.quote_font_size_base}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Servizi</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="7" max="14" step="0.5"
                    value={stilePdf.quote_font_size_service}
                    onChange={e => setS('quote_font_size_service', e.target.value)}
                    className="flex-1 accent-zinc-400"
                  />
                  <span className="text-xs font-mono text-zinc-300 w-8 text-right">{stilePdf.quote_font_size_service}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Prezzi</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min="7" max="14" step="0.5"
                    value={stilePdf.quote_font_size_price}
                    onChange={e => setS('quote_font_size_price', e.target.value)}
                    className="flex-1 accent-zinc-400"
                  />
                  <span className="text-xs font-mono text-zinc-300 w-8 text-right">{stilePdf.quote_font_size_price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Margins */}
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Margini (mm)</h2>
            <div className="grid grid-cols-4 gap-4">
              {(['quote_margin_top', 'quote_margin_right', 'quote_margin_bottom', 'quote_margin_left'] as const).map(field => {
                const labels = { quote_margin_top: 'Alto', quote_margin_right: 'Destra', quote_margin_bottom: 'Basso', quote_margin_left: 'Sinistra' };
                return (
                  <div key={field}>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">{labels[field]}</label>
                    <Input
                      type="number" min="0" max="50" step="1"
                      value={stilePdf[field]}
                      onChange={e => setS(field, e.target.value)}
                      placeholder="20"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sezioni visibili */}
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Sezioni visibili nel preventivo</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(sectionLabels) as (keyof QuoteSections)[]).map(key => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stilePdf.quote_sections[key]}
                    onChange={() => toggleSection(key)}
                    className="accent-zinc-400 w-4 h-4"
                  />
                  <span className="text-sm text-zinc-300">{sectionLabels[key]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'firma' && (
        <div className="bg-[#09090b] border border-white/10 rounded-lg divide-y divide-zinc-800">
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold text-zinc-400 mb-4 uppercase tracking-wide">Firma digitale</h2>
            <p className="text-xs text-zinc-500 mb-3">Disegna la tua firma. Verrà usata nei preventivi al posto della riga di firma.</p>
            <SignaturePad
              value={firma.quote_signature_image}
              onChange={value => setFirmaState(prev => ({ ...prev, quote_signature_image: value }))}
            />
          </div>
          <div className="px-6 py-5">
            <label className="block text-xs font-medium text-zinc-400 mb-1">Ruolo / Titolo</label>
            <Input
              value={firma.quote_signature_role}
              onChange={e => setFirmaState(prev => ({ ...prev, quote_signature_role: e.target.value }))}
              placeholder="CEO, Direttore Commerciale..."
            />
            <p className="text-xs text-zinc-500 mt-1">Appare sotto la firma nel preventivo.</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          variant="default"
        >
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva impostazioni'}
        </Button>
      </div>

      {/* MarginFormulaModal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white">Formule di calcolo margine</h3>
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Ricavi</p>
                  <p className="font-mono text-zinc-200">Ricavi = Canone × Mesi + Una Tantum</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Costo Contenuti</p>
                  <p className="font-mono text-zinc-200">= (Post + Reel + Caroselli + Video) × Costo Unitario (listino)</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Costo Coordinamento</p>
                  <p className="font-mono text-zinc-200">= Ore stimate × Costo Orario Interno</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Budget Pubblicitario</p>
                  <p className="font-mono text-zinc-200">= Budget incluso nel pacchetto Servizio</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Costo Totale</p>
                  <p className="font-mono text-zinc-200">= Costo Contenuti + Costo Coord. + Budget Pub.</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 border-l-2 border-l-zinc-400">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Margine Netto</p>
                  <p className="font-mono text-white font-semibold">= Ricavi − Costo Totale</p>
                  <p className="font-mono text-zinc-400 text-xs mt-1">Margine % = Margine Netto / Ricavi × 100</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
