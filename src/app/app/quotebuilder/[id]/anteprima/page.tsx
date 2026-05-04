import { QuotePreview } from './QuotePreview';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuotePreviewPage({ params }: Props) {
  const { id } = await params;
  return <QuotePreview quoteId={id} />;
}
