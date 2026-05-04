import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Account, Quote, QuoteItem, Client } from './types';

type FullQuote = Quote & {
  clients: Pick<Client, 'id' | 'name' | 'company' | 'email' | 'address' | 'phone'> | null;
  quote_items: QuoteItem[];
};

const eur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const dt = (s: string) =>
  new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

export async function exportQuoteToWord(quote: FullQuote, account: Account) {
  const items = [...quote.quote_items].sort((a, b) => a.sort_order - b.sort_order);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const ivaAmt = quote.show_iva ? subtotal * (quote.iva_percent ?? 22) / 100 : 0;
  const total = subtotal + ivaAmt;

  const primaryHex = (account.quote_color_primary ?? '#09090b').replace('#', '');
  const sections = account.quote_sections ?? { header_azienda: true, box_cliente: true, box_totali: true, footer: true, note_servizi: true, titolo_preventivo: true, firma: true };

  const children: (Paragraph | Table)[] = [];

  // --- Header azienda ---
  if (sections.header_azienda) {
    const aziendaName = account.company_name ?? account.full_name ?? account.email;
    children.push(
      new Paragraph({
        children: [new TextRun({ text: aziendaName, bold: true, size: 28, color: primaryHex })],
      })
    );
    if (account.ragione_sociale) {
      children.push(new Paragraph({ children: [new TextRun({ text: account.ragione_sociale, size: 20, color: '71717a' })] }));
    }
    if (account.address) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${account.address}${account.cap ? ', ' + account.cap : ''}${account.city ? ' ' + account.city : ''}`, size: 20, color: '71717a' })],
      }));
    }
    if (account.partita_iva) {
      children.push(new Paragraph({ children: [new TextRun({ text: `P.IVA: ${account.partita_iva}`, size: 20, color: '71717a' })] }));
    }
    if (account.phone) {
      children.push(new Paragraph({ children: [new TextRun({ text: `Tel: ${account.phone}`, size: 20, color: '71717a' })] }));
    }
    if (account.website) {
      children.push(new Paragraph({ children: [new TextRun({ text: account.website, size: 20, color: '71717a' })] }));
    }
    children.push(new Paragraph({ text: '' }));
  }

  // --- Titolo preventivo ---
  if (sections.titolo_preventivo) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'PREVENTIVO', bold: true, size: 36, color: primaryHex, allCaps: true })],
        alignment: AlignmentType.RIGHT,
      })
    );
    if (quote.quote_number) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `N° ${quote.quote_number}`, size: 20, color: '71717a' })],
          alignment: AlignmentType.RIGHT,
        })
      );
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Data: ${dt(quote.created_at)}`, size: 20, color: '71717a' })],
        alignment: AlignmentType.RIGHT,
      })
    );
    if (quote.valid_until) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Valido fino al: ${dt(quote.valid_until)}`, size: 20, color: '71717a' })],
          alignment: AlignmentType.RIGHT,
        })
      );
    }
    children.push(new Paragraph({ text: '' }));
  }

  // --- Box cliente ---
  if (sections.box_cliente && quote.clients) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'DESTINATARIO', size: 16, color: '71717a', allCaps: true })] })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: quote.clients.company ?? quote.clients.name, bold: true, size: 22, color: primaryHex })],
      })
    );
    if (quote.clients.company) {
      children.push(new Paragraph({ children: [new TextRun({ text: quote.clients.name, size: 20 })] }));
    }
    if (quote.clients.address) {
      children.push(new Paragraph({ children: [new TextRun({ text: quote.clients.address, size: 20, color: '71717a' })] }));
    }
    if (quote.clients.email) {
      children.push(new Paragraph({ children: [new TextRun({ text: quote.clients.email, size: 20, color: '71717a' })] }));
    }
    children.push(new Paragraph({ text: '' }));
  }

  // --- Titolo documento ---
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: quote.title, bold: true, size: 26, color: primaryHex })],
    })
  );
  children.push(new Paragraph({ text: '' }));

  // --- Tabella voci ---
  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Servizio', bold: true, color: 'FFFFFF', size: 20 })] })],
        shading: { type: ShadingType.SOLID, color: primaryHex },
        width: { size: 55, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Qtà', bold: true, color: 'FFFFFF', size: 20 })] , alignment: AlignmentType.CENTER })],
        shading: { type: ShadingType.SOLID, color: primaryHex },
        width: { size: 10, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Prezzo unit.', bold: true, color: 'FFFFFF', size: 20 })], alignment: AlignmentType.RIGHT })],
        shading: { type: ShadingType.SOLID, color: primaryHex },
        width: { size: 17, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Totale', bold: true, color: 'FFFFFF', size: 20 })], alignment: AlignmentType.RIGHT })],
        shading: { type: ShadingType.SOLID, color: primaryHex },
        width: { size: 18, type: WidthType.PERCENTAGE },
      }),
    ],
  });

  const itemRows = items.map((item, idx) =>
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ children: [new TextRun({ text: item.name ?? '', bold: true, size: 20 })] }),
            ...(sections.note_servizi && item.description
              ? [new Paragraph({ children: [new TextRun({ text: item.description, size: 18, color: '71717a' })] })]
              : []),
          ],
          shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? 'fafafa' : 'FFFFFF' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: String(item.quantity), size: 20 })], alignment: AlignmentType.CENTER })],
          shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? 'fafafa' : 'FFFFFF' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: eur(item.unit_price), size: 20 })], alignment: AlignmentType.RIGHT })],
          shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? 'fafafa' : 'FFFFFF' },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: eur(item.quantity * item.unit_price), bold: true, size: 20 })], alignment: AlignmentType.RIGHT })],
          shading: { type: ShadingType.SOLID, color: idx % 2 === 0 ? 'fafafa' : 'FFFFFF' },
        }),
      ],
    })
  );

  children.push(
    new Table({
      rows: [headerRow, ...itemRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
    })
  );
  children.push(new Paragraph({ text: '' }));

  // --- Totali ---
  if (sections.box_totali) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Imponibile: ${eur(subtotal)}`, size: 20, color: '71717a' })],
        alignment: AlignmentType.RIGHT,
      })
    );
    if (quote.show_iva) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `IVA ${quote.iva_percent ?? 22}%: ${eur(ivaAmt)}`, size: 20, color: '71717a' })],
          alignment: AlignmentType.RIGHT,
        })
      );
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Totale: ${eur(total)}`, bold: true, size: 24, color: primaryHex })],
        alignment: AlignmentType.RIGHT,
      })
    );
    children.push(new Paragraph({ text: '' }));
  }

  // --- Footer pagamenti ---
  if (sections.footer && (quote.payment_terms ?? account.quote_payment_terms)) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: 'CONDIZIONI DI PAGAMENTO', size: 16, color: '71717a', allCaps: true })] })
    );
    children.push(
      new Paragraph({ children: [new TextRun({ text: quote.payment_terms ?? account.quote_payment_terms ?? '', size: 20 })] })
    );
    children.push(new Paragraph({ text: '' }));
  }

  // --- Firma ---
  if (sections.firma && (quote.signature_name ?? account.quote_signature_name)) {
    const sigName = quote.signature_name ?? account.quote_signature_name ?? '';
    const sigRole = quote.signature_role ?? account.quote_signature_role;
    children.push(
      new Paragraph({
        children: [new TextRun({ text: sigName, bold: true, size: 20 })],
        alignment: AlignmentType.RIGHT,
      })
    );
    if (sigRole) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: sigRole, size: 18, color: '71717a' })],
          alignment: AlignmentType.RIGHT,
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: (account.quote_margin_top ?? 15) * 567,
              right: (account.quote_margin_right ?? 15) * 567,
              bottom: (account.quote_margin_bottom ?? 15) * 567,
              left: (account.quote_margin_left ?? 15) * 567,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = quote.quote_number
    ? `preventivo_${quote.quote_number.replace(/[^a-zA-Z0-9]/g, '_')}.docx`
    : `preventivo_${quote.id.slice(0, 8)}.docx`;
  saveAs(blob, filename);
}
