'use server';

import { createClient } from '@/lib/supabase-server';

export async function getOrCreateQuoteToken(
  quoteId: string
): Promise<{ token: string; expires_at: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autenticato' };

  // Risolvi l'account_id effettivo (owner o dipendente)
  let accountId = user.id;
  const { data: ownerAccount } = await supabase.from('accounts').select('id').eq('id', user.id).single();
  if (!ownerAccount) {
    // È un dipendente: cerca l'account_id dell'owner
    const { createAdminClient } = await import('@/lib/supabase-admin');
    const admin = createAdminClient();
    const { data: member } = await admin.from('team_users').select('account_id').eq('user_id', user.id).eq('status', 'active').single();
    if (member) accountId = member.account_id;
  }

  // Verifica che il preventivo appartenga all'account
  const { data: quote } = await supabase
    .from('quotes')
    .select('id')
    .eq('id', quoteId)
    .eq('account_id', accountId)
    .single();
  if (!quote) return { error: 'Preventivo non trovato' };

  // Cerca token attivo esistente
  const { data: existing } = await supabase
    .from('quote_public_tokens')
    .select('token, expires_at')
    .eq('quote_id', quoteId)
    .eq('account_id', accountId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing) return { token: existing.token, expires_at: existing.expires_at };

  // Crea nuovo token (scade tra 7 giorni)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: newToken, error } = await supabase
    .from('quote_public_tokens')
    .insert({
      quote_id: quoteId,
      account_id: accountId,
      expires_at: expiresAt.toISOString(),
    })
    .select('token, expires_at')
    .single();

  if (error || !newToken) return { error: 'Errore generazione token' };
  return { token: newToken.token, expires_at: newToken.expires_at };
}
