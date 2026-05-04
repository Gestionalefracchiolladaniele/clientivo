import { PermissionGate } from '@/components/PermissionGate';
import CostiFornitoreView from './CostiFornitoreView';

export default function CostiFornitorePageWrapper() {
  return (
    <PermissionGate permission="can_view_supplier_costs" sectionName="Costi Fornitore">
      <CostiFornitoreView />
    </PermissionGate>
  );
}
