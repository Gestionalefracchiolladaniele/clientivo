import { PermissionGate } from '@/components/PermissionGate';
import StoricoContrattiView from './StoricoContrattiView';

export default function StoricoContrattiPage() {
  return (
    <PermissionGate permission="can_view_storico_contratti" sectionName="Storico Contratti">
      <StoricoContrattiView />
    </PermissionGate>
  );
}
