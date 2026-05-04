import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let action: 'accepted' | 'rejected';
  try {
    const body = await request.json();
    if (body.action !== 'accepted' && body.action !== 'rejected') {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }
    action = body.action;
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verifica token
  const { data: tokenData } = await supabase
    .from('quote_public_tokens')
    .select('id, quote_id, account_id, expires_at, is_active')
    .eq('token', token)
    .single();

  if (!tokenData) {
    return NextResponse.json({ error: 'Token non trovato' }, { status: 404 });
  }

  if (!tokenData.is_active) {
    return NextResponse.json({ error: 'Link già utilizzato' }, { status: 410 });
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link scaduto' }, { status: 410 });
  }

  // Aggiorna status preventivo
  const { error: quoteErr } = await supabase
    .from('quotes')
    .update({ status: action })
    .eq('id', tokenData.quote_id);

  if (quoteErr) {
    return NextResponse.json({ error: 'Errore aggiornamento preventivo' }, { status: 500 });
  }

  // Invalida token (monouso)
  await supabase
    .from('quote_public_tokens')
    .update({ is_active: false })
    .eq('id', tokenData.id);

  // Recupera dati per la notifica
  const { data: quoteData } = await supabase
    .from('quotes')
    .select('quote_number, title, client_id')
    .eq('id', tokenData.quote_id)
    .single();

  let clientName = 'Cliente';
  if (quoteData?.client_id) {
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, company')
      .eq('id', quoteData.client_id)
      .single();
    if (clientData) {
      clientName = clientData.company ?? clientData.name;
    }
  }

  // Crea notifica per l'owner
  await supabase.from('notifications').insert({
    account_id: tokenData.account_id,
    quote_id: tokenData.quote_id,
    client_name: clientName,
    quote_number: quoteData?.quote_number ?? quoteData?.title ?? null,
    action,
  });

  return NextResponse.json({ ok: true });
}
