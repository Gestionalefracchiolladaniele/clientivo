'use server';

import { createClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-admin';

/**
 * Restituisce l'account_id effettivo per l'utente corrente.
 * - Se è un owner: ritorna user.id (ha un record in accounts)
 * - Se è un dipendente (team_users.status=active): ritorna account_id dell'owner
 * - Fallback Layer 2: se esiste un invite pendente con la stessa email, lo accetta al volo
 *
 * Usato per filtrare le query lato client in modo corretto per entrambi i ruoli.
 */
export async function getEffectiveAccountId(): Promise<string> {
  const user = await requireAuth();
  const supabase = await createClient();

  // Controlla se esiste un record accounts per questo utente (è un owner)
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', user.id)
    .single();

  if (account) return user.id;

  const admin = createAdminClient();

  // È un dipendente attivo: cerca il suo account_id in team_users
  const { data: activeMember } = await admin
    .from('team_users')
    .select('account_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (activeMember) return activeMember.account_id;

  // Layer 2 fallback: utente loggato con invito pendente (es. già aveva Google account).
  // Completa il bind automaticamente se trova un record pending con stessa email.
  if (user.email) {
    const { data: pendingMember } = await admin
      .from('team_users')
      .select('id, account_id, invite_token, invite_expires_at')
      .eq('email', user.email)
      .eq('status', 'pending')
      .single();

    if (
      pendingMember &&
      (!pendingMember.invite_expires_at ||
        new Date(pendingMember.invite_expires_at) >= new Date())
    ) {
      // Completa il bind: associa user_id e attiva il membro
      const { error } = await admin
        .from('team_users')
        .update({
          user_id: user.id,
          status: 'active',
          invite_token: null,
          invite_expires_at: null,
        })
        .eq('id', pendingMember.id);

      if (!error) {
        // Rimuovi eventuale accounts record orfano dell'employee
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).rpc('cleanup_employee_account', { p_user_id: user.id });
        return pendingMember.account_id;
      }
    }
  }

  // Fallback finale: ritorna user.id
  return user.id;
}
