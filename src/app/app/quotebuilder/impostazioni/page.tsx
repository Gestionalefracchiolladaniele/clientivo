import { PermissionGate } from '@/components/PermissionGate';
import QuoteBuilderImpostazioniView from './QuoteBuilderImpostazioniView';

export default function QuoteBuilderImpostazioniPage() {
  return (
    <PermissionGate permission="can_view_impostazioni" sectionName="Impostazioni">
      <QuoteBuilderImpostazioniView />
    </PermissionGate>
  );
}
