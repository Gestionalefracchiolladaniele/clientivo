import { PermissionGate } from '@/components/PermissionGate';
import OneDigitDashboard from './OneDigitDashboard';

export default function OneDigitPage() {
  return (
    <PermissionGate permission="can_view_onedigit_dashboard" sectionName="Dashboard OneDigit">
      <OneDigitDashboard />
    </PermissionGate>
  );
}
