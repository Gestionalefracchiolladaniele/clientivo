import { cache } from 'react';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { AllPermissions } from '@/lib/actions/team-users';

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

// cache() deduplicates calls within the same request — no cookie lock conflicts
export const getPermissions = cache(async (): Promise<AllPermissions & { role: 'owner' | 'admin' | 'member' }> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...allTrue, role: 'member' };

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', user.id)
    .single();

  if (account) return { ...allTrue, role: 'owner' };

  const admin = createAdminClient();
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
});
