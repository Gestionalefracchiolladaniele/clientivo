import { PermissionGate } from '@/components/PermissionGate';
import { QuoteEditor } from './QuoteEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuoteEditorPage({ params }: Props) {
  const { id } = await params;
  return (
    <PermissionGate permission="can_edit_quotes" sectionName="Editor Preventivi">
      <QuoteEditor quoteId={id} />
    </PermissionGate>
  );
}
