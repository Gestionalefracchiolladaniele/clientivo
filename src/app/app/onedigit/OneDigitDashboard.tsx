'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Contract, Client, Commercial } from '@/lib/types';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';

type ContractFull = Contract & {
  clients: Pick<Client, 'id' | 'name' | 'company'> | null;
  commercials: Pick<Commercial, 'name' | 'commission_percent'> | null;
};

const formatEur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

function isActiveInMonth(c: ContractFull, monthStart: Date, monthEnd: Date): boolean {
  if (c.status !== 'active') return false;
  const start = parseISO(c.start_date);
  if (start > monthEnd) return false;
  if (c.end_date) {
    const end = parseISO(c.end_date);
    if (end < monthStart) return false;
  }
  return true;
}

export default function OneDigitDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts_dashboard'],
    queryFn: async () => {
      if (!accountId) throw new Error('Account not ready');
      const { data, error } = await supabase
        .from('contracts')
        .select('*, clients(id, name, company), commercials(name, commission_percent)')
        .eq('account_id', accountId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return data as ContractFull[];
    },
    enabled: !!accountId,
  });

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const activeThisMonth = contracts.filter(c => isActiveInMonth(c, monthStart, monthEnd));
  const allActive = contracts.filter(c => c.status === 'active');

  // KPI mese
  const fatturatoMese = activeThisMonth.reduce((s, c) => s + (c.canone_mensile ?? 0), 0);
  const provvigioniMese = activeThisMonth.reduce((s, c) => {
    const pct = c.commercials?.commission_percent ?? 0;
    return s + (c.canone_mensile ?? 0) * pct / 100;
  }, 0);
  const marginalitaLordaMese = fatturatoMese; // senza costo fornitore (richiede lookup)
  const margineNettoMese = marginalitaLordaMese - provvigioniMese;

  // KPI anno (contratti attivi totali)
  const fatturatoAnno = allActive.reduce((s, c) => s + (c.canone_mensile ?? 0) * 12, 0);

  const kpiMese = [
    { label: 'Fatturato Mese', value: formatEur(fatturatoMese), sub: 'canone mensile contratti attivi' },
    { label: 'Provvigioni', value: formatEur(provvigioniMese), sub: 'stimate da commerciali' },
    { label: 'Margine Lordo', value: formatEur(marginalitaLordaMese), sub: 'escl. costo fornitore' },
    { label: 'Margine Netto', value: formatEur(margineNettoMese), sub: 'fatturato - provvigioni' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold -ml-0.5">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Panoramica KPI mensile e portafoglio clienti.</p>
        </div>
        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5">
          <button
            onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-zinc-700 w-32 text-center">
            {format(selectedMonth, 'MMMM yyyy', { locale: it })}
          </span>
          <button
            onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI anno */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fatturato Annuo Ricorrente</p>
          <p className="text-3xl font-bold text-white tabular-nums">{formatEur(fatturatoAnno)}</p>
          <p className="text-xs text-zinc-600 mt-1">{allActive.length} contratti attivi × 12 mesi</p>
        </div>
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Contratti Attivi</p>
          <p className="text-3xl font-bold text-white tabular-nums">{allActive.length}</p>
          <p className="text-xs text-zinc-600 mt-1">su {contracts.length} totali</p>
        </div>
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Scaduti / Annullati</p>
          <p className="text-3xl font-bold text-white tabular-nums">
            {contracts.filter(c => c.status === 'expired' || c.status === 'cancelled').length}
          </p>
          <p className="text-xs text-zinc-600 mt-1">contratti chiusi</p>
        </div>
      </div>

      {/* KPI mese */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          KPI — {format(selectedMonth, 'MMMM yyyy', { locale: it })}
        </h2>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {kpiMese.map(k => (
            <div key={k.label} className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{k.label}</p>
              <p className="text-2xl font-bold text-white tabular-nums">{k.value}</p>
              <p className="text-xs text-zinc-600 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabella clienti attivi nel mese */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Clienti attivi — {format(selectedMonth, 'MMMM yyyy', { locale: it })} ({activeThisMonth.length})
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-100 rounded animate-pulse" />
            ))}
          </div>
        ) : activeThisMonth.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-lg px-6 py-10 text-center">
            <TrendingUp className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Nessun contratto attivo in questo mese.</p>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Contratto</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Commerciale</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">Canone</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">Provvigione</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">Margine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {activeThisMonth.map(c => {
                  const canone = c.canone_mensile ?? 0;
                  const pct = c.commercials?.commission_percent ?? 0;
                  const provv = canone * pct / 100;
                  const margine = canone - provv;
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {c.clients ? (c.clients.company ?? c.clients.name) : '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{c.title}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {c.commercials
                          ? <span>{c.commercials.name} <span className="text-zinc-400">({pct}%)</span></span>
                          : <span className="text-zinc-400">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900 tabular-nums">
                        {formatEur(canone)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500 tabular-nums">
                        {formatEur(provv)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900 tabular-nums">
                        {formatEur(margine)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-zinc-50 border-t border-zinc-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-zinc-600">Totale</td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-900 tabular-nums">{formatEur(fatturatoMese)}</td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-500 tabular-nums">{formatEur(provvigioniMese)}</td>
                  <td className="px-4 py-3 text-right font-bold text-zinc-900 tabular-nums">{formatEur(margineNettoMese)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
