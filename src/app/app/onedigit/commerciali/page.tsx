import { PermissionGate } from '@/components/PermissionGate';
import CommercialiView from './CommercialiView';

export default function CommercialiPage() {
  return (
    <PermissionGate permission="can_view_commercials" sectionName="Commerciali">
      <CommercialiView />
    </PermissionGate>
  );
}
