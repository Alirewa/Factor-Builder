'use client';

import { InvoiceData, InvoiceTotals, INVOICE_TYPE_TITLES } from '@/types/invoice';
import { formatMoney, currencyLabel, formatPercent, discountLabel, toJalali, toPersianDigits } from '@/lib/utils';
import {
  TemplateRoot, ItemsTable, AmountInWords, NotesBlock,
  SignatureRow, InvoiceFooter, useFs,
} from './shared';

interface Props { invoice: InvoiceData; totals: InvoiceTotals; }

export function MinimalTemplate({ invoice, totals }: Props) {
  return (
    <TemplateRoot invoice={invoice} style={{ padding: '0 0 18px' }}>
      <Body invoice={invoice} totals={totals} />
    </TemplateRoot>
  );
}

function Body({ invoice, totals }: Props) {
  const { customization, seller, buyer } = invoice;
  const primary = customization.primaryColor;
  const cur = customization.currency;
  const lbl = currencyLabel(cur);

  const brandFs = useFs(customization.logoImage ? 16 : 21);
  const titleFs = useFs(12.5);
  const metaFs = useFs(11);
  const partyLabelFs = useFs(10);
  const partyNameFs = useFs(12.5);
  const partyBodyFs = useFs(10.5);
  const sumFs = useFs(11.5);
  const grandLabelFs = useFs(12.5);
  const grandFs = useFs(15);

  return (
    <div style={{ padding: '16px 28px 0' }}>
      {/* Header — 3-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '18px', gap: '12px' }}>
        {/* Right: logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {customization.logoImage && (
            <img src={customization.logoImage} alt="" style={{ height: '42px', maxWidth: '110px', objectFit: 'contain', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: brandFs, fontWeight: 900, lineHeight: 1.25 }}>
              {seller.company || seller.name || 'نام فروشگاه / برند'}
            </div>
            {seller.company && seller.name && (
              <div style={{ fontSize: partyBodyFs, color: '#94a3b8' }}>{seller.name}</div>
            )}
          </div>
        </div>

        {/* Center: document title */}
        <div style={{ textAlign: 'center', padding: '0 12px' }}>
          <div
            style={{
              display: 'inline-block',
              border: `1.5px solid ${primary}`,
              color: primary,
              fontSize: titleFs,
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {INVOICE_TYPE_TITLES[invoice.invoiceType]}
          </div>
        </div>

        {/* Left: number + dates */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ fontSize: metaFs, borderCollapse: 'collapse' }}>
            <tbody>
              <MRowMeta label="شماره" value={invoice.invoiceNumber} ltr />
              <MRowMeta label="تاریخ" value={toJalali(invoice.invoiceDate)} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Thin gradient divider */}
      <div style={{ height: '2px', background: `linear-gradient(to left, ${primary}, transparent)`, marginBottom: '18px' }} />

      {/* Parties */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '18px' }}>
        {[
          { label: 'فروشنده', party: seller },
          { label: 'خریدار', party: buyer },
        ].map(({ label, party }) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ fontSize: partyLabelFs, fontWeight: 800, color: primary, marginBottom: '5px' }}>
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
      <div style={{ marginBottom: '16px' }}>
        <ItemsTable invoice={invoice} primary={primary} alternateRow="#f9fafb" />
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '280px', fontSize: sumFs }}>
          <MRow label="جمع اقلام" value={`${formatMoney(totals.subtotal, cur)} ${lbl}`} />
          {customization.showDiscount && totals.globalDiscountAmount > 0 && (
            <MRow label={`تخفیف (${discountLabel(invoice.globalDiscount, invoice.globalDiscountType, cur)})`} value={`−${formatMoney(totals.globalDiscountAmount, cur)} ${lbl}`} />
          )}
          {customization.showTax && totals.taxAmount > 0 && (
            <MRow label={`مالیات (${formatPercent(invoice.taxRate)})`} value={`+${formatMoney(totals.taxAmount, cur)} ${lbl}`} />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `2px solid ${primary}`, paddingTop: '7px', marginTop: '6px', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: grandLabelFs, whiteSpace: 'nowrap' }}>مبلغ قابل پرداخت</span>
            <span style={{ fontWeight: 900, fontSize: grandFs, color: primary, direction: 'ltr', whiteSpace: 'nowrap' }}>
              {formatMoney(totals.total, cur)} {lbl}
            </span>
          </div>
        </div>
      </div>

      <AmountInWords invoice={invoice} totals={totals} />

      <div style={{ marginTop: '12px' }}>
        <NotesBlock invoice={invoice} primary={primary} />
      </div>

      <SignatureRow invoice={invoice} />
      <InvoiceFooter invoice={invoice} primary={primary} />
    </div>
  );
}

function MRowMeta({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <tr>
      <td style={{ color: '#94a3b8', padding: '2px 0 2px 8px', whiteSpace: 'nowrap', textAlign: 'right' }}>{label}:</td>
      <td style={{ fontWeight: 700, padding: '2px 0', whiteSpace: 'nowrap', direction: ltr ? 'ltr' : 'rtl', textAlign: 'left' }}>
        {value || '—'}
      </td>
    </tr>
  );
}

function MRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
      <span style={{ color: '#94a3b8' }}>{label}</span>
      <span style={{ color: '#475569', fontWeight: 600, direction: 'ltr', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}
