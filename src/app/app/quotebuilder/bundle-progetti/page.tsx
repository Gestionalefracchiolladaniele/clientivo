import { PermissionGate } from '@/components/PermissionGate';
import BundleProggettiView from './BundleProggettiView';

export default function BundleProggettiPage() {
  return (
    <PermissionGate permission="can_view_bundle" sectionName="Bundle Progetti">
      <BundleProggettiView />
    </PermissionGate>
  );
}
