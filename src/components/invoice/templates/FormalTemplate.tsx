'use client';

import { InvoiceData, InvoiceTotals } from '@/types/invoice';
import {
  TemplateRoot, InvoiceHeaderBlock, PartyBox, ItemsTable,
  TotalsSummary, AmountInWords, NotesBlock, SignatureRow, InvoiceFooter,
} from './shared';

interface Props { invoice: InvoiceData; totals: InvoiceTotals; }

export function FormalTemplate({ invoice, totals }: Props) {
  const primary = invoice.customization.primaryColor;

  return (
    <TemplateRoot invoice={invoice}>
      {/* Top accent line */}
      <div style={{ height: '4px', background: primary }} />

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

        {/* Notes + financial summary side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
          <div>
            <NotesBlock invoice={invoice} primary={primary} />
          </div>
          <div style={{ minWidth: '270px', border: `1px solid ${primary}33`, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ background: primary, color: '#fff', fontSize: '11px', fontWeight: 700, padding: '6px 12px' }}>
              خلاصه مالی
            </div>
            <div style={{ padding: '11px' }}>
              <TotalsSummary invoice={invoice} totals={totals} primary={primary} />
            </div>
          </div>
        </div>

        <AmountInWords invoice={invoice} totals={totals} />

        <SignatureRow invoice={invoice} />
      </div>

      {/* Bottom accent */}
      <div style={{ height: '4px', background: primary }} />

      <InvoiceFooter invoice={invoice} primary={primary} />
    </TemplateRoot>
  );
}
