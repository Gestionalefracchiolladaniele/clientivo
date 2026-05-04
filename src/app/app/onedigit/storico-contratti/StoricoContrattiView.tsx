'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';
import { createClient as supabaseClient } from '@/lib/supabase';
import type { Contract, Client } from '@/lib/types';
import { useEffectiveAccountId } from '@/hooks/useEffectiveAccountId';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

type ContractWithClient = Contract & { clients: Pick<Client, 'name' | 'company'> | null };
type TabId = 'rinnovi' | 'disdette' | 'in_scadenza';

const formatEur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const formatDate = (d: string) => format(new Date(d), 'd MMM yyyy', { locale: it });

export default function StoricoContrattiView() {
  const [activeTab, setActiveTab] = useState<TabId>('in_scadenza');
  const supabase = supabaseClient();
  const { data: accountId } = useEffectiveAccountId();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts_storico'],
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

  const today = new Date();
  const in60days = addDays(today, 60);

  const rinnovati = contracts.filter(c => c.renewal_count > 0);
  const disdette = contracts.filter(c => c.status === 'cancelled');
  const inScadenza = contracts.filter(c => {
    if (!c.end_date || c.status !== 'active') return false;
    const end = new Date(c.end_date);
    return isAfter(end, today) && isBefore(end, in60days);
  });

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'in_scadenza', label: 'In Scadenza', count: inScadenza.length },
    { id: 'rinnovi', label: 'Rinnovi', count: rinnovati.length },
    { id: 'disdette', label: 'Disdette', count: disdette.length },
  ];

  const currentList =
    activeTab === 'rinnovi' ? rinnovati
    : activeTab === 'disdette' ? disdette
    : inScadenza;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold -ml-0.5">Storico Contratti</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Rinnovi, disdette e contratti in scadenza entro 60 giorni.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Rinnovati</p>
          <p className="text-3xl font-bold text-white tabular-nums">{rinnovati.length}</p>
          <p className="text-xs text-zinc-600 mt-1">con almeno 1 rinnovo</p>
        </div>
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Disdette</p>
          <p className="text-3xl font-bold text-white tabular-nums">{disdette.length}</p>
          <p className="text-xs text-zinc-600 mt-1">contratti annullati</p>
        </div>
        <div className="bg-[#09090b] border border-white/10 rounded-lg px-5 py-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">In Scadenza</p>
          <p className="text-3xl font-bold text-white tabular-nums">{inScadenza.length}</p>
          <p className="text-xs text-zinc-600 mt-1">entro 60 giorni</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 rounded-lg p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-white text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                activeTab === tab.id ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-200 text-zinc-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-100 rounded animate-pulse" />
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nessun contratto"
          description={
            activeTab === 'in_scadenza' ? 'Nessun contratto attivo in scadenza entro 60 giorni.'
            : activeTab === 'rinnovi' ? 'Nessun contratto rinnovato.'
            : 'Nessuna disdetta registrata.'
          }
        />
      ) : (
        <div className="bg-[#09090b] border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Titolo</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Stato</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Inizio</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Fine</th>
                {activeTab === 'rinnovi' && (
                  <th className="text-right px-4 py-3 font-medium text-zinc-600">N° Rinnovi</th>
                )}
                {activeTab === 'disdette' && (
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Disdetta il</th>
                )}
                <th className="text-right px-4 py-3 font-medium text-zinc-600">Canone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentList.map(c => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{c.title}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {c.clients ? (c.clients.company ?? c.clients.name) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      c.status === 'active' ? 'success'
                      : c.status === 'cancelled' ? 'danger'
                      : c.status === 'expired' ? 'warning'
                      : 'secondary'
                    }>
                      {c.status === 'active' ? 'Attivo' : c.status === 'cancelled' ? 'Annullato' : c.status === 'expired' ? 'Scaduto' : 'Bozza'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{formatDate(c.start_date)}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {c.end_date ? formatDate(c.end_date) : '—'}
                  </td>
                  {activeTab === 'rinnovi' && (
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      {c.renewal_count}×
                    </td>
                  )}
                  {activeTab === 'disdette' && (
                    <td className="px-4 py-3 text-zinc-400">
                      {c.cancelled_at ? formatDate(c.cancelled_at) : '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-semibold text-white tabular-nums">
                    {formatEur(c.canone_mensile ?? 0)}/mese
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
