'use client';

import { InvoiceData, InvoiceTotals } from '@/types/invoice';
import {
  TemplateRoot, InvoiceHeaderBlock, ItemsTable, AmountInWords,
  NotesBlock, SignatureRow, InvoiceFooter, useFs,
} from './shared';
import { formatMoney, currencyLabel, formatPercent, discountLabel, toPersianDigits } from '@/lib/utils';

interface Props { invoice: InvoiceData; totals: InvoiceTotals; }

export function CorporateTemplate({ invoice, totals }: Props) {
  return (
    <TemplateRoot invoice={invoice}>
      <Body invoice={invoice} totals={totals} />
    </TemplateRoot>
  );
}

function Body({ invoice, totals }: Props) {
  const { customization } = invoice;
  const primary = customization.primaryColor;
  const cur = customization.currency;
  const lbl = currencyLabel(cur);

  const partyLabelFs = useFs(10);
  const partyNameFs = useFs(12.5);
  const partyBodyFs = useFs(10.5);
  const boxLabelFs = useFs(10.5);
  const boxBodyFs = useFs(11.5);
  const grandFs = useFs(14);

  return (
    <>
      {/* Dark-background header variant */}
      <div style={{ background: '#0f172a' }}>
        <InvoiceHeaderBlock invoice={invoice} primary={primary} dark />
      </div>

      <div style={{ padding: '14px 24px 18px' }}>
        {/* Parties with accent border */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
          {[
            { label: 'مشخصات فروشنده', party: invoice.seller, accent: primary },
            { label: 'مشخصات خریدار', party: invoice.buyer, accent: '#0f172a' },
          ].map(({ label, party, accent }) => (
            <div key={label} style={{ flex: 1, minWidth: 0, borderRight: `3px solid ${accent}`, paddingRight: '10px' }}>
              <div style={{ fontSize: partyLabelFs, fontWeight: 800, color: accent, marginBottom: '4px' }}>
                {label}
              </div>
              <div style={{ fontSize: partyNameFs, fontWeight: 700 }}>
                {party.company || party.name || <span style={{ color: '#cbd5e1' }}>تکمیل نشده</span>}
              </div>
              {party.company && party.name && <div style={{ fontSize: partyBodyFs, color: '#64748b' }}>{party.name}</div>}
              {party.nationalId && <div style={{ fontSize: partyBodyFs, color: '#64748b' }}>شناسه / کد ملی: {toPersianDigits(party.nationalId)}</div>}
              {party.phone && <div style={{ fontSize: partyBodyFs, color: '#64748b', unicodeBidi: 'plaintext' }}>تلفن: {toPersianDigits(party.phone)}</div>}
              {party.email && <div style={{ fontSize: partyBodyFs, color: '#64748b', unicodeBidi: 'plaintext' }}>{party.email}</div>}
              {party.address && <div style={{ fontSize: partyBodyFs, color: '#64748b' }}>نشانی: {party.address}</div>}
            </div>
          ))}
        </div>

        {/* Items */}
        <div style={{ marginBottom: '14px' }}>
          <ItemsTable invoice={invoice} primary={primary} alternateRow="#f8fafc" />
        </div>

        {/* Notes + dark totals box */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
          <div>
            <NotesBlock invoice={invoice} primary={primary} />
          </div>

          <div style={{ minWidth: '270px', background: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: boxLabelFs, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>خلاصه مالی</div>
            </div>
            <div style={{ padding: '11px 14px', fontSize: boxBodyFs }}>
              <CRow label="جمع اقلام" value={`${formatMoney(totals.subtotal, cur)}`} />
              {customization.showDiscount && totals.globalDiscountAmount > 0 && (
                <CRow label={`تخفیف (${discountLabel(invoice.globalDiscount, invoice.globalDiscountType, cur)})`} value={`−${formatMoney(totals.globalDiscountAmount, cur)}`} green />
              )}
              {customization.showTax && totals.taxAmount > 0 && (
                <CRow label={`مالیات (${formatPercent(invoice.taxRate)})`} value={`+${formatMoney(totals.taxAmount, cur)}`} orange />
              )}
            </div>
            <div style={{ background: primary, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: boxBodyFs, whiteSpace: 'nowrap' }}>مبلغ نهایی</span>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: grandFs, direction: 'ltr', whiteSpace: 'nowrap' }}>
                {formatMoney(totals.total, cur)} {lbl}
              </span>
            </div>
          </div>
        </div>

        <AmountInWords invoice={invoice} totals={totals} />

        <SignatureRow invoice={invoice} />
      </div>

      <InvoiceFooter invoice={invoice} primary={primary} />
    </>
  );
}

function CRow({ label, value, green, orange }: { label: string; value: string; green?: boolean; orange?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', gap: '8px' }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ color: green ? '#4ade80' : orange ? '#fb923c' : 'rgba(255,255,255,0.9)', fontWeight: 600, direction: 'ltr', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  );
}
