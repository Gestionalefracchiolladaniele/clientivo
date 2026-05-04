'use client';

import { useState } from 'react';
import { Download, CheckCircle, XCircle } from 'lucide-react';
import type { Quote, QuoteItem, Client, Account } from '@/lib/types';
import { downloadPdf } from '@/lib/downloadPdf';

interface Props {
  quote: Quote & { quote_items: QuoteItem[] };
  client: Pick<Client, 'id' | 'name' | 'company' | 'email' | 'address' | 'phone'> | null;
  account: Account;
  token: string;
}

type ResponseState = 'idle' | 'loading' | 'done' | 'error';

const formatEur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

export function PublicQuoteView({ quote, client, account, token }: Props) {
  const [responseState, setResponseState] = useState<ResponseState>('idle');
  const [lastAction, setLastAction] = useState<'accepted' | 'rejected' | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const items = [...quote.quote_items].sort((a, b) => a.sort_order - b.sort_order);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const ivaAmt = quote.show_iva ? subtotal * (quote.iva_percent ?? 22) / 100 : 0;
  const total = subtotal + ivaAmt;

  const sections = account.quote_sections ?? {
    header_azienda: true,
    box_cliente: true,
    box_totali: true,
    footer: true,
    note_servizi: true,
    titolo_preventivo: true,
    firma: true,
    allegato_tecnico: false,
  };

  const primaryColor = account.quote_color_primary ?? '#09090b';
  const textColor = account.quote_color_text ?? '#09090b';
  const secondaryColor = account.quote_color_secondary ?? '#71717a';
  const fontSizeBase = account.quote_font_size_base ?? 14;
  const marginTop = account.quote_margin_top ?? 15;
  const marginRight = account.quote_margin_right ?? 15;
  const marginBottom = account.quote_margin_bottom ?? 15;
  const marginLeft = account.quote_margin_left ?? 15;

  const effectiveLogo = quote.logo_url || account.logo_url;

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    const filename = `Preventivo_${quote.quote_number ?? quote.title}.pdf`;
    await downloadPdf('quote-document-public', filename);
    setDownloadingPdf(false);
  }

  async function handleResponse(action: 'accepted' | 'rejected') {
    setResponseState('loading');
    setLastAction(action);
    try {
      const res = await fetch(`/api/quote-response/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Errore risposta');
      setResponseState('done');
      if (action === 'accepted') {
        const filename = `Preventivo_${quote.quote_number ?? quote.title}.pdf`;
        await downloadPdf('quote-document-public', filename);
      }
    } catch {
      setResponseState('error');
    }
  }

  if (responseState === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center max-w-sm px-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            lastAction === 'accepted' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {lastAction === 'accepted' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-zinc-800 mb-2">
            {lastAction === 'accepted' ? 'Preventivo accettato' : 'Preventivo rifiutato'}
          </h1>
          <p className="text-sm text-zinc-500">
            {lastAction === 'accepted'
              ? 'Grazie! La tua risposta è stata registrata. Sarai contattato al più presto.'
              : 'Risposta registrata. Non esitare a contattarci per ulteriori informazioni.'}
          </p>
          {lastAction === 'accepted' && (
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors mx-auto disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Generazione...' : 'Scarica PDF'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Toolbar cliente — nascosta in stampa */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700">
            {quote.quote_number ? `Preventivo ${quote.quote_number}` : quote.title}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-100 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloadingPdf ? 'Generazione...' : 'Scarica PDF'}
          </button>
          {responseState === 'error' && (
            <p className="text-xs text-red-500">Errore. Riprova.</p>
          )}
          <button
            onClick={() => handleResponse('rejected')}
            disabled={responseState === 'loading'}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Rifiuta
          </button>
          <button
            onClick={() => handleResponse('accepted')}
            disabled={responseState === 'loading'}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {responseState === 'loading' ? 'Invio...' : 'Accetta'}
          </button>
        </div>
      </div>

      {/* Documento A4 */}
      <div className="py-10 px-4 flex justify-center print:py-0 print:px-0">
        <div
          id="quote-document-public"
          className="bg-white shadow-xl print:shadow-none"
          style={{
            fontFamily: "'Plus Jakarta Sans', Georgia, sans-serif",
            fontSize: fontSizeBase,
            color: textColor,
            paddingTop: `${marginTop}mm`,
            paddingRight: `${marginRight}mm`,
            paddingBottom: `${marginBottom}mm`,
            paddingLeft: `${marginLeft}mm`,
            width: '210mm',
            minHeight: '297mm',
            boxSizing: 'border-box',
          }}
        >
          {/* ── HEADER ─────────────────────────────────────────── */}
          {sections.header_azienda && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.25rem' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%', verticalAlign: 'top', padding: 0 }}>
                    {effectiveLogo && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={effectiveLogo}
                        alt="Logo"
                        style={{ height: 44, maxWidth: 150, objectFit: 'contain', display: 'block', marginBottom: '0.875rem' }}
                      />
                    )}
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: primaryColor, lineHeight: 1.25, marginBottom: '0.1rem' }}>
                      {account.company_name ?? account.full_name ?? account.email}
                    </p>
                    {account.ragione_sociale && (
                      <p style={{ fontSize: '0.75rem', color: secondaryColor, marginBottom: '0.5rem', lineHeight: 1.4 }}>
                        {account.ragione_sociale}
                      </p>
                    )}
                    <div style={{ fontSize: '0.74rem', color: secondaryColor, lineHeight: 1.8 }}>
                      {account.address && (
                        <p>{account.address}{account.cap ? `, ${account.cap}` : ''}{account.city ? ` ${account.city}` : ''}</p>
                      )}
                      {account.partita_iva && <p>P.IVA: {account.partita_iva}</p>}
                      {account.phone && <p>Tel: {account.phone}</p>}
                      {account.website && <p>{account.website}</p>}
                    </div>
                  </td>

                  <td style={{ width: '50%', verticalAlign: 'top', padding: 0, textAlign: 'right' }}>
                    {sections.titolo_preventivo && (
                      <>
                        <p style={{
                          fontSize: '2rem',
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: primaryColor,
                          lineHeight: 1,
                          paddingBottom: '0.75rem',
                          textAlign: 'right',
                          margin: 0,
                        }}>
                          Preventivo
                        </p>
                        {quote.quote_number && (
                          <p style={{
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: primaryColor,
                            letterSpacing: '0.06em',
                            textAlign: 'right',
                            margin: 0,
                            marginTop: '0.75rem',
                            paddingBottom: '0.5rem',
                          }}>
                            N° {quote.quote_number}
                          </p>
                        )}
                        <div style={{ fontSize: '0.74rem', color: secondaryColor, textAlign: 'right', lineHeight: 1.9 }}>
                          <p>Data: <span style={{ color: textColor, fontWeight: 600 }}>{formatDate(quote.created_at)}</span></p>
                          {quote.valid_until && (
                            <p>Valido fino al: <span style={{ color: textColor, fontWeight: 600 }}>{formatDate(quote.valid_until)}</span></p>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* ── DIVISORE PRIMARIO ──────────────────────────────── */}
          <div style={{ height: '2px', backgroundColor: primaryColor, marginBottom: '2rem', borderRadius: 1 }} />

          {/* ── DESTINATARIO + OGGETTO ─────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', padding: 0, paddingRight: '0.75rem' }}>
                  {sections.box_cliente && client && (
                    <>
                      <p style={{
                        fontSize: '0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        fontWeight: 700,
                        color: secondaryColor,
                        marginBottom: '0.5rem',
                      }}>
                        Destinatario
                      </p>
                      <div style={{
                        borderLeft: `3px solid ${primaryColor}`,
                        paddingLeft: '0.875rem',
                        paddingTop: '0.1rem',
                        paddingBottom: '0.1rem',
                      }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: primaryColor, lineHeight: 1.3, marginBottom: '0.15rem' }}>
                          {client.company ?? client.name}
                        </p>
                        {client.company && (
                          <p style={{ fontSize: '0.78rem', color: textColor, marginBottom: '0.25rem' }}>{client.name}</p>
                        )}
                        <div style={{ fontSize: '0.74rem', color: secondaryColor, lineHeight: 1.8 }}>
                          {client.address && <p>{client.address}</p>}
                          {client.email && <p>{client.email}</p>}
                          {client.phone && <p>{client.phone}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </td>

                <td style={{ width: '50%', verticalAlign: 'top', padding: 0, paddingLeft: '0.75rem', textAlign: 'right' }}>
                  {sections.titolo_preventivo && quote.title && (
                    <>
                      <p style={{
                        fontSize: '0.6rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        fontWeight: 700,
                        color: secondaryColor,
                        marginBottom: '0.5rem',
                        textAlign: 'right',
                      }}>
                        Oggetto
                      </p>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: textColor, lineHeight: 1.45, textAlign: 'right' }}>
                        {quote.title}
                      </p>
                    </>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── TABELLA SERVIZI ────────────────────────────────── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: account.quote_font_size_service ?? fontSizeBase, marginBottom: '1.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th style={{ textAlign: 'left', padding: '0.65rem 1rem', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', color: '#fff', textTransform: 'uppercase' }}>
                  Descrizione
                </th>
                <th style={{ textAlign: 'center', padding: '0.65rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', color: '#fff', textTransform: 'uppercase', width: 48 }}>
                  Qtà
                </th>
                <th style={{ textAlign: 'right', padding: '0.65rem 0.75rem', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', color: '#fff', textTransform: 'uppercase', width: 100 }}>
                  Prezzo
                </th>
                <th style={{ textAlign: 'right', padding: '0.65rem 1rem', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.06em', color: '#fff', textTransform: 'uppercase', width: 100 }}>
                  Totale
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem 1rem', textAlign: 'center', color: secondaryColor, fontSize: '0.8rem', fontStyle: 'italic', borderBottom: '1px solid #e4e4e7' }}>
                    Nessun servizio aggiunto
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e4e4e7' }}>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'top' }}>
                      {item.name && (
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', color: textColor, lineHeight: 1.35, marginBottom: sections.note_servizi && item.description ? '0.2rem' : 0 }}>
                          {item.name}
                        </p>
                      )}
                      {sections.note_servizi && item.description && (
                        <p style={{ fontSize: '0.72rem', color: secondaryColor, lineHeight: 1.55 }}>{item.description}</p>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center', verticalAlign: 'top', fontSize: '0.82rem', color: textColor }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right', verticalAlign: 'top', fontSize: account.quote_font_size_price ?? fontSizeBase, color: secondaryColor }}>
                      {formatEur(item.unit_price)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', verticalAlign: 'top', fontSize: account.quote_font_size_price ?? fontSizeBase, fontWeight: 700, color: textColor }}>
                      {formatEur(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── BOX TOTALI ─────────────────────────────────────── */}
          {sections.box_totali && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.25rem' }}>
              <div style={{ width: 240 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', fontSize: '0.78rem', color: secondaryColor, borderBottom: '1px solid #e4e4e7' }}>
                  <span>Imponibile</span>
                  <span>{formatEur(subtotal)}</span>
                </div>
                {quote.show_iva && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', fontSize: '0.78rem', color: secondaryColor, borderBottom: '1px solid #e4e4e7' }}>
                    <span>IVA {quote.iva_percent ?? 22}%</span>
                    <span>{formatEur(ivaAmt)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 0.875rem',
                  marginTop: '0.5rem',
                  backgroundColor: primaryColor,
                  borderRadius: '6px',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}>
                  <span>Totale</span>
                  <span>{formatEur(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── CONDIZIONI DI PAGAMENTO ────────────────────────── */}
          {sections.footer && (quote.payment_terms ?? account.quote_payment_terms) && (
            <div style={{
              marginBottom: '2rem',
              padding: '0.875rem 1rem',
              borderRadius: '6px',
              borderLeft: `3px solid ${primaryColor}`,
              backgroundColor: '#fafafa',
            }}>
              <p style={{
                fontSize: '0.6rem',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontWeight: 700,
                color: secondaryColor,
                marginBottom: '0.35rem',
              }}>
                Condizioni di pagamento
              </p>
              <p style={{ fontSize: '0.78rem', color: textColor, lineHeight: 1.75, whiteSpace: 'pre-line' }}>
                {quote.payment_terms ?? account.quote_payment_terms}
              </p>
            </div>
          )}

          {/* ── FIRMA ──────────────────────────────────────────── */}
          {sections.firma && account.quote_signature_image && (
            <div style={{ marginTop: '3rem', textAlign: 'right' }}>
              <div style={{ display: 'inline-block', textAlign: 'center', minWidth: 200 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={account.quote_signature_image}
                  alt="Firma"
                  style={{ maxHeight: 64, maxWidth: 220, objectFit: 'contain', display: 'block', margin: '0 auto 0.5rem auto' }}
                />
                <div style={{ borderTop: `2px solid ${primaryColor}`, paddingTop: '0.45rem' }}>
                  {account.quote_signature_role && (
                    <p style={{ fontSize: '0.7rem', color: secondaryColor }}>
                      {account.quote_signature_role}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
