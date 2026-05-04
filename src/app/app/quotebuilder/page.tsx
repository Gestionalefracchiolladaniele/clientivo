import { PermissionGate } from '@/components/PermissionGate';
import { QuoteBuilderDashboard } from './QuoteBuilderDashboard';

export default function QuoteBuilderPage() {
  return (
    <PermissionGate permission="can_view_quotes" sectionName="Preventivi">
      <QuoteBuilderDashboard />
    </PermissionGate>
  );
}
