'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Props {
  token: string;
  inviteeName: string;
  inviteeEmail: string;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export function AcceptInviteClient({ token, inviteeName, inviteeEmail }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleAccept = async () => {
    setIsLoading(true);
    // Salva il token in un cookie HTTP-only via route server-side.
    // document.cookie client-side non sopravvive al round-trip OAuth con certi browser.
    const res = await fetch('/api/invite/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      setIsLoading(false);
      return;
    }
    const callbackUrl = `${window.location.origin}/auth/callback?next=/app/quotebuilder`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          login_hint: inviteeEmail,
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm px-4">
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-white mb-1">Sei stato invitato</h1>
            <p className="text-sm text-zinc-400">
              Ciao <span className="text-white font-medium">{inviteeName}</span>, accedi con Google
              per accettare l&apos;invito e iniziare a collaborare.
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-3 mb-6 text-center">
            <p className="text-xs text-zinc-500">Account suggerito</p>
            <p className="text-sm text-zinc-300 font-medium mt-0.5">{inviteeEmail}</p>
          </div>

          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <GoogleIcon />
            {isLoading ? 'Reindirizzamento...' : 'Accedi con Google e accetta'}
          </button>

          <p className="text-xs text-zinc-600 text-center mt-4">
            Accedendo accetti i termini del servizio. L&apos;invito scade tra 7 giorni.
          </p>
        </div>
      </div>
    </div>
  );
}
