'use client';

import { useState, useEffect } from 'react';
import { Send, Mail, MessageCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { getOrCreateQuoteToken } from '@/lib/actions/quote-tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  quoteLabel: string;
  defaultEmail?: string;
  defaultPhone?: string;
  onMailtoOpened?: () => void;
}

type Channel = 'gmail' | 'whatsapp';

export function SendQuoteDialog({ open, onClose, quoteId, quoteLabel, defaultEmail = '', defaultPhone = '', onMailtoOpened }: Props) {
  const [channel, setChannel] = useState<Channel>('gmail');
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail);
      setPhone(defaultPhone);
      setError('');
      setChannel('gmail');
    }
  }, [open, defaultEmail, defaultPhone]);

  async function handleSend() {
    setError('');

    if (channel === 'gmail') {
      const trimmed = email.trim();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setError('Inserisci un indirizzo email valido');
        return;
      }
    } else {
      const trimmed = phone.trim();
      if (!trimmed) {
        setError('Inserisci un numero di telefono');
        return;
      }
    }

    setSending(true);
    try {
      const result = await getOrCreateQuoteToken(quoteId);
      if ('error' in result) {
        setError(result.error);
        return;
      }

      const appUrl = window.location.origin;
      const previewUrl = `${appUrl}/preview/${result.token}`;

      if (channel === 'gmail') {
        const subject = encodeURIComponent(`Preventivo ${quoteLabel}`);
        const body = encodeURIComponent(
          `Gentile Cliente,\n\n` +
          `Le invio il preventivo ${quoteLabel} per sua valutazione.\n\n` +
          `Può visualizzarlo, scaricarlo in PDF e accettarlo o rifiutarlo al seguente link:\n` +
          `${previewUrl}\n\n` +
          `Il link è valido per 7 giorni.\n\n` +
          `Rimango a disposizione per qualsiasi informazione.\n\n` +
          `Cordiali saluti`
        );
        window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email.trim())}&su=${subject}&body=${body}`, '_blank');
      } else {
        const rawPhone = phone.trim().replace(/\s+/g, '');
        const message = encodeURIComponent(
          `Ciao! Ti invio il preventivo ${quoteLabel}.\n\n` +
          `Puoi visualizzarlo, scaricarlo in PDF e accettarlo o rifiutarlo qui:\n` +
          `${previewUrl}\n\n` +
          `Il link è valido per 7 giorni.`
        );
        window.open(`https://wa.me/${rawPhone}?text=${message}`, '_blank');
      }

      onMailtoOpened?.();
      onClose();
    } catch {
      setError('Errore durante la generazione del link');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Invia al cliente" className="max-w-sm">
      <div className="space-y-4">
        {/* Scelta canale */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setChannel('gmail'); setError(''); }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              channel === 'gmail'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <Mail className="w-4 h-4" />
            Gmail
          </button>
          <button
            type="button"
            onClick={() => { setChannel('whatsapp'); setError(''); }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              channel === 'whatsapp'
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
        </div>

        {/* Campo input dinamico */}
        {channel === 'gmail' ? (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Email destinatario
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="cliente@example.com"
              autoFocus
              className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Numero WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="+39 333 123 4567"
              autoFocus
              className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <p className="text-xs text-zinc-500">
          Verrà aperto {channel === 'gmail' ? 'Gmail' : 'WhatsApp'} con un link sicuro valido 7 giorni.
          Il cliente potrà accettare o rifiutare il preventivo dal link.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Generazione link...' : channel === 'gmail' ? 'Apri Gmail' : 'Apri WhatsApp'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
