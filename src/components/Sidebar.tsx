'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAccount } from '@/hooks/useAccount';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import Image from 'next/image';
import React from 'react';
import type { Notification } from '@/lib/types';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  UserCheck,
  Warehouse,
  History,
  Settings,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutList,
  Layers,
  Bell,
  CheckCheck,
  X,
  UsersRound,
} from 'lucide-react';

const modules = [
  {
    id: 'onedigit',
    label: 'OneDigit',
    href: '/app/onedigit',
    icon: LayoutDashboard,
    children: [
      { label: 'Dashboard', href: '/app/onedigit', icon: LayoutDashboard },
      { label: 'Clienti', href: '/app/onedigit/clienti', icon: Users },
      { label: 'Pacchetti', href: '/app/onedigit/pacchetti', icon: Package },
      { label: 'Commerciali', href: '/app/onedigit/commerciali', icon: UserCheck },
      { label: 'Costi Fornitore', href: '/app/onedigit/costi-fornitore', icon: Warehouse },
      { label: 'Storico Contratti', href: '/app/onedigit/storico-contratti', icon: History },
    ],
  },
  {
    id: 'quotebuilder',
    label: 'QuoteBuilder',
    href: '/app/quotebuilder',
    icon: FileText,
    children: [
      { label: 'Preventivi', href: '/app/quotebuilder', icon: FileText },
      { label: 'Servizi Template', href: '/app/quotebuilder/servizi', icon: LayoutList },
      { label: 'Bundle Progetti', href: '/app/quotebuilder/bundle-progetti', icon: Layers },
      { label: 'Impostazioni', href: '/app/impostazioni', icon: Settings },
    ],
  },
];

const topLevelLinks: { label: string; href: string; icon: React.ElementType }[] = [
  { label: 'Team', href: '/app/team', icon: UsersRound },
];

// ── Notifications drawer ────────────────────────────────────────────────────

function useNotifications() {
  const supabase = createClient();

  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const qc = useQueryClient();

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const ids = notifications.filter(n => !n.is_read).map(n => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { notifications, unreadCount, markRead, markAllRead, refetch };
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Adesso';
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  return `${days}g fa`;
}

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
  sidebarCollapsed: boolean;
}

function NotificationsDrawer({ open, onClose, sidebarCollapsed }: NotificationsDrawerProps) {
  const { notifications, markRead, markAllRead } = useNotifications();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sidebarWidth = sidebarCollapsed ? 56 : 180;

  function handleNotificationClick(n: Notification) {
    if (!n.is_read) markRead.mutate(n.id);
    onClose();
    if (n.quote_id) router.push(`/app/quotebuilder/${n.quote_id}`);
  }

  return (
    <div
      ref={drawerRef}
      className="fixed top-0 z-50 flex flex-col bg-[#18181b] border-r border-white/10 shadow-2xl"
      style={{ left: sidebarWidth, width: 300, height: '100vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold text-white">Notifiche</span>
        <div className="flex items-center gap-1">
          {notifications.some(n => !n.is_read) && (
            <button
              onClick={() => markAllRead.mutate()}
              title="Segna tutte come lette"
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tutte lette
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600">
            <Bell className="w-8 h-8" />
            <p className="text-xs">Nessuna notifica</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-zinc-800/50 transition-colors ${
                  !n.is_read ? 'bg-zinc-800/30' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  )}
                  <div className={!n.is_read ? '' : 'ml-4'}>
                    <p className="text-xs text-white leading-snug">
                      <span className="font-semibold">{n.client_name}</span>
                      {' '}ha{' '}
                      <span className={n.action === 'accepted' ? 'text-green-400' : 'text-red-400'}>
                        {n.action === 'accepted' ? 'accettato' : 'rifiutato'}
                      </span>
                      {n.quote_number ? ` il preventivo #${n.quote_number}` : ' il preventivo'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">{formatTimeAgo(n.created_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { data: account } = useAccount();
  const { unreadCount } = useNotifications();

  const [collapsed, setCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    const active = modules.find(m => pathname.startsWith(m.href));
    return active ? [active.id] : ['onedigit'];
  });
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <>
      <aside
        className="flex flex-col h-screen bg-[#18181b] border-r border-white/10 transition-all duration-200 shrink-0"
        style={{ width: collapsed ? 56 : 180 }}
      >
        {/* Logo + Collapse button */}
        <div className="flex items-center justify-between border-b border-white/10 px-2 py-2 gap-2">
          <div className="flex items-center">
            {collapsed ? (
              <Image src="/logo.png" alt="Clientivo" width={32} height={32} className="object-contain" />
            ) : (
              <Image src="/logo.png" alt="Clientivo" width={140} height={40} className="object-contain" />
            )}
          </div>
          <button
            onClick={toggleCollapsed}
            className="flex items-center justify-center shrink-0 p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors duration-150"
            title={collapsed ? 'Espandi sidebar' : 'Collassa sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-1.5 px-1.5 flex flex-col gap-0.5">
          {modules.map(mod => {
            const Icon = mod.icon;
            const isActiveModule = pathname.startsWith(mod.href);
            const isExpanded = expandedModules.includes(mod.id);

            return (
              <div key={mod.id}>
                <button
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      localStorage.setItem('sidebar-collapsed', 'false');
                      setExpandedModules([mod.id]);
                    } else {
                      toggleModule(mod.id);
                    }
                  }}
                  className={`w-full flex items-center justify-center ${!collapsed ? 'justify-start' : ''} gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors duration-150 ${
                    isActiveModule
                      ? 'bg-zinc-800 text-white border-l-2 border-white pl-[6px]'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                  }`}
                  title={collapsed ? mod.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{mod.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-zinc-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      )}
                    </>
                  )}
                </button>

                {/* Sub items */}
                {!collapsed && isExpanded && (
                  <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-zinc-800 pl-2">
                    {mod.children.map(child => {
                      const ChildIcon = child.icon;
                      const isActive = pathname === child.href || pathname.startsWith(child.href + '/');
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium transition-colors duration-150 ${
                            isActive
                              ? 'text-white bg-zinc-800'
                              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40'
                          }`}
                        >
                          <ChildIcon className="w-3 h-3 shrink-0" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Top-level links (Team) */}
          <div className="mt-0.5 pt-0.5 border-t border-zinc-800 flex flex-col gap-0.5">
            {topLevelLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-center ${!collapsed ? 'justify-start' : ''} gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                  }`}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom: notifiche + profile + logout */}
        <div className="border-t border-white/10 px-1.5 py-2 flex flex-col gap-1">
          {/* Notifiche */}
          <button
            onClick={() => setNotifOpen(v => !v)}
            className={`relative flex items-center justify-center gap-2 px-2 py-1.5 rounded text-xs transition-colors duration-150 ${
              notifOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
            }`}
            title={collapsed ? 'Notifiche' : undefined}
          >
            <Bell className="w-4 h-4 shrink-0" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {!collapsed && <span className="flex-1 text-left">Notifiche</span>}
            {!collapsed && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div
            className="flex items-center justify-center gap-2 px-2 py-1.5 rounded text-xs text-zinc-400"
            title={collapsed ? (account?.full_name ?? account?.email ?? 'Profile') : undefined}
          >
            {account?.avatar_url ? (
              <img
                src={account.avatar_url}
                alt={account.full_name ?? ''}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                <User className="w-2.5 h-2.5 text-zinc-400" />
              </div>
            )}
            {!collapsed && (
              <span className="text-xs truncate text-zinc-400">
                {account?.full_name ?? account?.email}
              </span>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-2 py-1.5 rounded text-xs text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors duration-150"
            title={collapsed ? 'Esci' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-xs">Esci</span>}
          </button>
        </div>
      </aside>

      {/* Notifications drawer — rendered outside aside to avoid clipping */}
      <NotificationsDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        sidebarCollapsed={collapsed}
      />
    </>
  );
}
