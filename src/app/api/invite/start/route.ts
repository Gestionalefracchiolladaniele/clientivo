import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token mancante' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: member } = await admin
      .from('team_users')
      .select('id, status, invite_expires_at')
      .eq('invite_token', token)
      .eq('status', 'pending')
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Token non valido' }, { status: 404 });
    }

    if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invito scaduto' }, { status: 410 });
    }

    // Cookie HTTP-only settato lato server — sopravvive al round-trip OAuth
    const cookieStore = await cookies();
    cookieStore.set('pending_invite_token', token, {
      path: '/',
      maxAge: 600,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
