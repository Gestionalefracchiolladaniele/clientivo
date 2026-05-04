import { getPermissions } from '@/lib/permissions';
import type { TeamUser } from '@/lib/types';
import { Lock } from 'lucide-react';

type PermKey = keyof Pick<TeamUser,
  | 'can_view_onedigit_dashboard' | 'can_view_clients' | 'can_view_packages'
  | 'can_view_contracts' | 'can_view_commercials' | 'can_view_supplier_costs'
  | 'can_view_storico_contratti' | 'can_view_quotes' | 'can_edit_quotes'
  | 'can_view_servizi' | 'can_view_bundle' | 'can_send_quotes' | 'can_view_impostazioni'
>;

function AccessDenied({ sectionName }: { sectionName: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
          <Lock className="w-6 h-6 text-zinc-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">Accesso non disponibile</h2>
          <p className="text-sm text-zinc-500">
            Spiacente, non hai i permessi per accedere a{' '}
            <span className="font-medium text-zinc-700">{sectionName}</span>.
            Richiedi l&apos;accesso al tuo owner/admin.
          </p>
        </div>
      </div>
    </div>
  );
}

interface PermissionGateProps {
  permission: PermKey;
  sectionName: string;
  children: React.ReactNode;
}

export async function PermissionGate({ permission, sectionName, children }: PermissionGateProps) {
  const perms = await getPermissions();
  if (!perms[permission]) return <AccessDenied sectionName={sectionName} />;
  return <>{children}</>;
}
