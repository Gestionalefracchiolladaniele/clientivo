import { PermissionGate } from '@/components/PermissionGate';
import ServiziView from './ServiziView';

export default function ServiziPage() {
  return (
    <PermissionGate permission="can_view_servizi" sectionName="Servizi Template">
      <ServiziView />
    </PermissionGate>
  );
}
