import { PermissionGate } from '@/components/PermissionGate';
import { ClientiView } from './ClientiView';

export default function ClientiPage() {
  return (
    <PermissionGate permission="can_view_clients" sectionName="Clienti">
      <ClientiView />
    </PermissionGate>
  );
}
