import { PermissionGate } from '@/components/PermissionGate';
import { ContrattiView } from './ContrattiView';

export default function ContrattiPage() {
  return (
    <PermissionGate permission="can_view_contracts" sectionName="Contratti">
      <ContrattiView />
    </PermissionGate>
  );
}
