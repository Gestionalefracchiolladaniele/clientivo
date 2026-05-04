'use server';

import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { TeamUser } from '@/lib/types';

export type AllPermissions = Pick<TeamUser,
  | 'can_view_onedigit_dashboard'
  | 'can_view_clients'
  | 'can_view_packages'
  | 'can_view_contracts'
  | 'can_view_commercials'
  | 'can_view_supplier_costs'
  | 'can_view_storico_contratti'
  | 'can_view_quotes'
  | 'can_edit_quotes'
  | 'can_view_servizi'
  | 'can_view_bundle'
  | 'can_send_quotes'
  | 'can_view_impostazioni'
>;

async function getCallerRole(accountId: string): Promise<'owner' | 'admin' | null> {
  const user = await requireAuth();
  // Se l'utente è l'owner dell'account
  const supabase = await createClient();
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', user.id)
    .eq('id', accountId)
    .single();
  if (account) return 'owner';

  // Altrimenti controlla se è admin nel team
  const admin = createAdminClient();
  const { data: member } = await admin
    .from('team_users')
    .select('role')
    .eq('account_id', accountId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  if (member?.role === 'admin') return 'admin';
  return null;
}

export async function getTeamUsers() {
  const user = await requireAuth();
  const supabase = await createClient();
  const admin = createAdminClient();

  // Determina l'account_id effettivo (owner o employee)
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', user.id)
    .single();

  let accountId = user.id;
  if (!account) {
    const { data: member } = await admin
      .from('team_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    if (member) accountId = member.account_id;
  }

  const { data, error } = await admin
    .from('team_users')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at');
  if (error) throw error;
  return data as TeamUser[];
}

export async function inviteTeamUser(formData: {
  name: string;
  email: string;
  role: 'admin' | 'member';
}) {
  const user = await requireAuth();
  const supabase = await createClient();
  const admin = createAdminClient();

  // Verifica che il caller sia owner o admin
  const callerRole = await getCallerRole(user.id);

  // Se non è owner, potrebbe essere admin di un account
  let accountId = user.id;
  if (!callerRole) {
    // Cerca se è admin di qualche account
    const { data: memberRecord } = await admin
      .from('team_users')
      .select('account_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['admin'])
      .single();
    if (!memberRecord) throw new Error('Non autorizzato a invitare membri');
    accountId = memberRecord.account_id;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Se esiste già un record disabled per questa email+account, riattivalo
  const { data: existing } = await admin
    .from('team_users')
    .select('id')
    .eq('account_id', accountId)
    .eq('email', formData.email)
    .eq('status', 'disabled')
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('team_users')
      .update({
        name: formData.name,
        role: formData.role,
        status: 'pending',
        user_id: null,
        invite_token: crypto.randomUUID(),
        invite_expires_at: expiresAt.toISOString(),
      })
      .eq('id', existing.id)
      .select('invite_token')
      .single();
    if (error) throw error;
    revalidatePath('/app/team');
    return data.invite_token as string;
  }

  const { data, error } = await supabase
    .from('team_users')
    .insert({
      account_id: accountId,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: 'pending',
      invite_expires_at: expiresAt.toISOString(),
    })
    .select('invite_token')
    .single();

  if (error) throw error;
  revalidatePath('/app/team');
  return data.invite_token as string;
}

export async function updateTeamUserPermissions(
  id: string,
  permissions: Partial<AllPermissions & { role: 'admin' | 'member' }>
) {
  const user = await requireAuth();
  const supabase = await createClient();
  const admin = createAdminClient();

  // Verifica che il target non sia owner
  const { data: target } = await admin
    .from('team_users')
    .select('role, account_id')
    .eq('id', id)
    .single();
  if (!target) throw new Error('Membro non trovato');
  if (target.role === 'owner') throw new Error('Non puoi modificare i permessi dell\'owner');

  // Owner: può modificare qualsiasi member del suo account
  const { data: ownerAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', target.account_id)
    .eq('id', user.id)
    .single();

  if (ownerAccount) {
    const { error } = await supabase
      .from('team_users')
      .update(permissions)
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/app/team');
    return;
  }

  // Admin: può modificare member (non owner, non altri admin se non è owner)
  const { data: adminRecord } = await admin
    .from('team_users')
    .select('role')
    .eq('account_id', target.account_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (adminRecord?.role !== 'admin') throw new Error('Non autorizzato');

  // Admin non può promuovere altri ad admin
  if (permissions.role === 'admin') throw new Error('Solo l\'owner può promuovere admin');

  const { error } = await admin
    .from('team_users')
    .update(permissions)
    .eq('id', id)
    .neq('role', 'owner');
  if (error) throw error;
  revalidatePath('/app/team');
}

export async function deleteTeamUser(id: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  const admin = createAdminClient();

  // Verifica che il target non sia owner
  const { data: target } = await admin
    .from('team_users')
    .select('role, account_id')
    .eq('id', id)
    .single();
  if (!target) throw new Error('Membro non trovato');
  if (target.role === 'owner') throw new Error('Non puoi rimuovere l\'owner');

  // Owner: può eliminare chiunque nel suo account
  const { data: ownerAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', target.account_id)
    .eq('id', user.id)
    .single();

  if (ownerAccount) {
    const { error } = await supabase
      .from('team_users')
      .delete()
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/app/team');
    return;
  }

  // Admin: può eliminare solo member
  const { data: adminRecord } = await admin
    .from('team_users')
    .select('role')
    .eq('account_id', target.account_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (adminRecord?.role !== 'admin') throw new Error('Non autorizzato');
  if (target.role === 'admin') throw new Error('Un admin non può eliminare un altro admin');

  const { error } = await admin
    .from('team_users')
    .delete()
    .eq('id', id)
    .eq('role', 'member');
  if (error) throw error;
  revalidatePath('/app/team');
}

// Chiamato dal callback OAuth dopo l'accept-invite
export async function acceptInvite(token: string, userId: string, avatarUrl?: string) {
  const admin = createAdminClient();

  const { data: member, error: fetchErr } = await admin
    .from('team_users')
    .select('id, invite_expires_at, status')
    .eq('invite_token', token)
    .single();

  if (fetchErr || !member) throw new Error('Token non valido');
  if (member.status !== 'pending') throw new Error('Invito già utilizzato');
  if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
    throw new Error('Invito scaduto');
  }

  const { error: updateErr } = await admin
    .from('team_users')
    .update({
      user_id: userId,
      status: 'active',
      invite_token: null,
      invite_expires_at: null,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    })
    .eq('id', member.id);

  if (updateErr) throw updateErr;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).rpc('cleanup_employee_account', { p_user_id: userId });
}

export async function getInviteByToken(token: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('team_users')
    .select('id, name, email, status, invite_expires_at, account_id')
    .eq('invite_token', token)
    .eq('status', 'pending')
    .single();
  return data ?? null;
}

// Ritorna il ruolo dell'utente loggato nel team (owner | admin | member)
export async function getCurrentUserRole(): Promise<'owner' | 'admin' | 'member'> {
  const user = await requireAuth();
  const supabase = await createClient();
  const admin = createAdminClient();

  // È owner se ha un record in accounts con id = user.id
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', user.id)
    .single();

  if (account) return 'owner';

  // Altrimenti cerca il ruolo nel team_users
  const { data: member } = await admin
    .from('team_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (member?.role === 'admin') return 'admin';
  return 'member';
}

// Ritorna i permessi dell'utente loggato (owner/admin hanno tutto, member ha i propri)
export async function getCurrentUserPermissions(): Promise<AllPermissions & { role: 'owner' | 'admin' | 'member' }> {
  const user = await requireAuth();
  const supabase = await createClient();
  const admin = createAdminClient();

  // Owner: accesso totale
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', user.id)
    .single();

  const allTrue: AllPermissions = {
    can_view_onedigit_dashboard: true,
    can_view_clients: true,
    can_view_packages: true,
    can_view_contracts: true,
    can_view_commercials: true,
    can_view_supplier_costs: true,
    can_view_storico_contratti: true,
    can_view_quotes: true,
    can_edit_quotes: true,
    can_view_servizi: true,
    can_view_bundle: true,
    can_send_quotes: true,
    can_view_impostazioni: true,
  };

  if (account) return { ...allTrue, role: 'owner' };

  // Member/Admin: leggi il record reale
  const { data: member } = await admin
    .from('team_users')
    .select('role, can_view_onedigit_dashboard, can_view_clients, can_view_packages, can_view_contracts, can_view_commercials, can_view_supplier_costs, can_view_storico_contratti, can_view_quotes, can_edit_quotes, can_view_servizi, can_view_bundle, can_send_quotes, can_view_impostazioni')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!member) return { ...allTrue, role: 'member' };

  if (member.role === 'admin') return { ...allTrue, role: 'admin' };

  return {
    role: 'member',
    can_view_onedigit_dashboard: member.can_view_onedigit_dashboard ?? false,
    can_view_clients: member.can_view_clients ?? false,
    can_view_packages: member.can_view_packages ?? false,
    can_view_contracts: member.can_view_contracts ?? false,
    can_view_commercials: member.can_view_commercials ?? false,
    can_view_supplier_costs: member.can_view_supplier_costs ?? false,
    can_view_storico_contratti: member.can_view_storico_contratti ?? false,
    can_view_quotes: member.can_view_quotes ?? false,
    can_edit_quotes: member.can_edit_quotes ?? false,
    can_view_servizi: member.can_view_servizi ?? false,
    can_view_bundle: member.can_view_bundle ?? false,
    can_send_quotes: member.can_send_quotes ?? false,
    can_view_impostazioni: member.can_view_impostazioni ?? false,
  };
}
