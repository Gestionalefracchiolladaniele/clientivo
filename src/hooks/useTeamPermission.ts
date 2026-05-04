'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUserPermissions } from '@/lib/actions/team-users';
import type { TeamUser } from '@/lib/types';

type PermKey = keyof Pick<TeamUser,
  | 'can_view_onedigit_dashboard' | 'can_view_clients' | 'can_view_packages'
  | 'can_view_contracts' | 'can_view_commercials' | 'can_view_supplier_costs'
  | 'can_view_storico_contratti' | 'can_view_quotes' | 'can_edit_quotes'
  | 'can_view_servizi' | 'can_view_bundle' | 'can_send_quotes' | 'can_view_impostazioni'
>;

export function useTeamPermission(permission: PermKey) {
  const { data: perms, isLoading } = useQuery({
    queryKey: ['current-user-permissions'],
    queryFn: getCurrentUserPermissions,
    staleTime: 30_000,
  });

  const hasAccess = perms ? perms[permission] : true; // default true mentre carica (evita flash)

  return { hasAccess, isLoading, role: perms?.role };
}
