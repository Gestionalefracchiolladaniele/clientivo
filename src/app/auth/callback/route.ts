import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { acceptInvite } from '@/lib/actions/team-users';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/onedigit';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Leggi pending_invite_token — cookie HTTP-only settato server-side da /api/invite/start
      const inviteToken = cookieStore.get('pending_invite_token')?.value;
      if (inviteToken) {
        cookieStore.set('pending_invite_token', '', { path: '/', maxAge: 0 });
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            await acceptInvite(inviteToken, user.id);
          } catch {
            return NextResponse.redirect(`${origin}/auth/accept-invite/error?reason=invite_invalid`);
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`);
}
