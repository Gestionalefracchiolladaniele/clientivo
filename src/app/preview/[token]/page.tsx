import { createAdminClient } from '@/lib/supabase-admin';
import { PublicQuoteView } from './PublicQuoteView';
import type { Account, Quote, QuoteItem, Client } from '@/lib/types';

export default async function PublicPreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminClient();

  // Verifica token
  const { data: tokenData } = await supabase
    .from('quote_public_tokens')
    .select('id, quote_id, account_id, expires_at, is_active')
    .eq('token', token)
    .single();

  if (!tokenData || !tokenData.is_active || new Date(tokenData.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center max-w-sm px-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2M10 9h2" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-800 mb-2">Link non più valido</h1>
          <p className="text-sm text-zinc-500">
            Questo link è scaduto, è già stato utilizzato, o non esiste.
          </p>
        </div>
      </div>
    );
  }

  // Fetch preventivo + righe
  const { data: quoteRaw } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .eq('id', tokenData.quote_id)
    .single();

  const quote = quoteRaw as unknown as Quote & { quote_items: QuoteItem[] };

  // Fetch cliente se presente
  let client: Pick<Client, 'id' | 'name' | 'company' | 'email' | 'address' | 'phone'> | null = null;
  if (quote?.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('id, name, company, email, address, phone')
      .eq('id', quote.client_id)
      .single();
    client = clientData;
  }

  // Fetch account (dati azienda + stile PDF)
  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', tokenData.account_id)
    .single();

  if (!quote || !account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-red-500">Preventivo non trovato.</p>
      </div>
    );
  }

  return (
    <PublicQuoteView
      quote={quote}
      client={client}
      account={account as Account}
      token={token}
    />
  );
}
