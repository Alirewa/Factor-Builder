'use client';

import { InvoiceData, InvoiceTotals } from '@/types/invoice';
import {
  TemplateRoot, InvoiceHeaderBlock, PartyBox, ItemsTable,
  TotalsSummary, AmountInWords, NotesBlock, SignatureRow, InvoiceFooter,
} from './shared';

interface Props { invoice: InvoiceData; totals: InvoiceTotals; }

export function ModernTemplate({ invoice, totals }: Props) {
  const primary = invoice.customization.primaryColor;

  return (
    <TemplateRoot invoice={invoice}>
      <InvoiceHeaderBlock invoice={invoice} primary={primary} />

      <div style={{ padding: '14px 24px 18px' }}>
        {/* Parties */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <PartyBox party={invoice.seller} label="فروشنده" primary={primary} />
          <PartyBox party={invoice.buyer} label="خریدار" primary={primary} />
        </div>

        {/* Items */}
        <div style={{ marginBottom: '14px' }}>
          <ItemsTable invoice={invoice} primary={primary} />
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              width: '280px',
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '12px',
              border: `1px solid ${primary}26`,
            }}
          >
            <TotalsSummary invoice={invoice} totals={totals} primary={primary} />
          </div>
        </div>

        <AmountInWords invoice={invoice} totals={totals} />

        <div style={{ marginTop: '12px' }}>
          <NotesBlock invoice={invoice} primary={primary} />
        </div>

        <SignatureRow invoice={invoice} />
      </div>

      <InvoiceFooter invoice={invoice} primary={primary} />
    </TemplateRoot>
  );
}
