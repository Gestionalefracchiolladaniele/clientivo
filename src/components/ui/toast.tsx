'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { clsx } from 'clsx';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-zinc-400',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={clsx(
              'flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 shadow-xl min-w-[280px]'
            )}>
              <Icon className={clsx('w-5 h-5 shrink-0', iconColors[t.type])} />
              <span className="text-sm font-medium text-white flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
