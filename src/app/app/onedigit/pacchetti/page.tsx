import { PermissionGate } from '@/components/PermissionGate';
import { PacchettiView } from './PacchettiView';

export default function PacchettiPage() {
  return (
    <PermissionGate permission="can_view_packages" sectionName="Pacchetti">
      <PacchettiView />
    </PermissionGate>
  );
}
