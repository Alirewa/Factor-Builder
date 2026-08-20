'use client';

import { InvoiceData, InvoiceTotals, INVOICE_TYPE_TITLES, DEFAULT_UNIT } from '@/types/invoice';
import { formatMoney, formatQuantity, formatPercent, discountLabel, currencyLabel, amountInWords, toJalali, toPersianDigits } from '@/lib/utils';
import { TemplateRoot, useFs, SignatureRow } from './shared';

interface Props { invoice: InvoiceData; totals: InvoiceTotals; }

// ─── Print-first Iranian store invoice ───────────────────────────────────────
// Deliberately monochrome: ruled boxes, grey table heads, black text. It comes
// out of a black-and-white laser printer looking like a real shop invoice pad,
// so `primaryColor` is intentionally not used here.
// ─────────────────────────────────────────────────────────────────────────────

const INK = '#111111';
const RULE = '#333333';
const HAIRLINE = '#9a9a9a';
const HEAD_FILL = '#e8e8e8';
const SOFT_FILL = '#f4f4f4';

/** Blank rows keep the form looking like a pre-printed pad instead of a stub. */
const MIN_ROWS = 6;

export function StoreTemplate({ invoice, totals }: Props) {
  return (
    <TemplateRoot invoice={invoice} style={{ color: INK, padding: '0 0 14px' }}>
      <Body invoice={invoice} totals={totals} />
    </TemplateRoot>
  );
}

function Body({ invoice, totals }: Props) {
  const { seller, buyer, items, customization } = invoice;
  const cur = customization.currency;
  const lbl = currencyLabel(cur);

  const brandFs = useFs(customization.logoImage ? 17 : 20);
  const subFs = useFs(10);
  const titleFs = useFs(14);
  const metaFs = useFs(11);
  const partyLabelFs = useFs(10);
  const partyFs = useFs(10.5);
  const headFs = useFs(10.5);
  const cellFs = useFs(11);
  const totalFs = useFs(11.5);
  const grandFs = useFs(13);
  const wordsFs = useFs(11);
  const noteFs = useFs(10.5);

  const blankRows = Math.max(0, MIN_ROWS - items.length);

  return (
    <div style={{ padding: '10px 20px 0' }}>
      {/* ── Masthead ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '14px',
          border: `1.5px solid ${RULE}`,
          borderRadius: '4px',
          padding: '10px 14px',
        }}
      >
        {/* Right: logo + shop name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {customization.logoImage && (
            <img
              src={customization.logoImage}
              alt=""
              style={{ height: '48px', maxWidth: '110px', objectFit: 'contain', flexShrink: 0 }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: brandFs, fontWeight: 900, lineHeight: 1.3 }}>
              {seller.company || seller.name || 'نام فروشگاه'}
            </div>
            {seller.company && seller.name && (
              <div style={{ fontSize: subFs, color: '#555' }}>{seller.name}</div>
            )}
          </div>
        </div>

        {/* Center: official document title */}
        <div
          style={{
            fontSize: titleFs,
            fontWeight: 900,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            border: `1.5px solid ${RULE}`,
            borderRadius: '3px',
            padding: '6px 16px',
            background: SOFT_FILL,
          }}
        >
          {INVOICE_TYPE_TITLES[invoice.invoiceType]}
        </div>

        {/* Left: serial + dates */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <table style={{ fontSize: metaFs, borderCollapse: 'collapse' }}>
            <tbody>
              <MetaRow label="شماره" value={invoice.invoiceNumber} ltr />
              <MetaRow label="تاریخ" value={toJalali(invoice.invoiceDate)} />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Parties ────────────────────────────────────────────────────── */}
      <div style={{ border: `1.5px solid ${RULE}`, borderRadius: '4px', marginTop: '8px', overflow: 'hidden' }}>
        <PartyStrip label="مشخصات فروشنده" party={seller} labelFs={partyLabelFs} fs={partyFs} />
        <div style={{ height: '1px', background: RULE }} />
        <PartyStrip label="مشخصات خریدار" party={buyer} labelFs={partyLabelFs} fs={partyFs} />
      </div>

      {/* ── Items + totals in one ruled table (classic Iranian layout) ─── */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          marginTop: '8px',
          border: `1.5px solid ${RULE}`,
        }}
      >
        <colgroup>
          <col style={{ width: '36px' }} />
          <col />
          <col style={{ width: '52px' }} />
          <col style={{ width: '64px' }} />
          <col style={{ width: '112px' }} />
          <col style={{ width: '118px' }} />
        </colgroup>

        <thead>
          <tr style={{ background: HEAD_FILL }}>
            {[
              ['ردیف', 'center'],
              ['شرح کالا / خدمات', 'center'],
              ['تعداد', 'center'],
              ['واحد', 'center'],
              [`مبلغ واحد (${lbl})`, 'center'],
              [`مبلغ کل (${lbl})`, 'center'],
            ].map(([label, align]) => (
              <th
                key={label}
                style={{
                  border: `1px solid ${RULE}`,
                  padding: '6px 6px',
                  fontSize: headFs,
                  fontWeight: 800,
                  textAlign: align as 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {items.map((item, i) => (
            <tr key={item.id}>
              <td style={{ ...cell, fontSize: cellFs, textAlign: 'center' }}>{i + 1}</td>
              <td style={{ ...cell, fontSize: cellFs, textAlign: 'right', wordBreak: 'break-word' }}>{item.name}</td>
              <td style={{ ...cell, fontSize: cellFs, textAlign: 'center' }}>{formatQuantity(item.quantity)}</td>
              <td style={{ ...cell, fontSize: cellFs, textAlign: 'center' }}>{item.unit || DEFAULT_UNIT}</td>
              <td style={{ ...cell, fontSize: cellFs, textAlign: 'left', direction: 'ltr' }}>
                {formatMoney(item.unitPrice, cur)}
              </td>
              <td style={{ ...cell, fontSize: cellFs, textAlign: 'left', direction: 'ltr', fontWeight: 700 }}>
                {formatMoney(item.total, cur)}
              </td>
            </tr>
          ))}

          {/* Blank ruled rows */}
          {Array.from({ length: blankRows }).map((_, i) => (
            <tr key={`blank-${i}`}>
              <td style={{ ...cell, fontSize: cellFs, textAlign: 'center', color: '#bbb' }}>{items.length + i + 1}</td>
              <td style={cell} />
              <td style={cell} />
              <td style={cell} />
              <td style={cell} />
              <td style={cell} />
            </tr>
          ))}
        </tbody>

        <tfoot>
          <SumRow label="جمع کل" value={`${formatMoney(totals.subtotal, cur)}`} fs={totalFs} />
          {customization.showDiscount && totals.globalDiscountAmount > 0 && (
            <SumRow
              label={`تخفیف (${discountLabel(invoice.globalDiscount, invoice.globalDiscountType, cur)})`}
              value={`−${formatMoney(totals.globalDiscountAmount, cur)}`}
              fs={totalFs}
            />
          )}
          {customization.showTax && totals.taxAmount > 0 && (
            <SumRow
              label={`مالیات بر ارزش افزوده (${formatPercent(invoice.taxRate)})`}
              value={`+${formatMoney(totals.taxAmount, cur)}`}
              fs={totalFs}
            />
          )}
          <tr style={{ background: HEAD_FILL }}>
            <td
              colSpan={5}
              style={{ ...cell, fontSize: grandFs, fontWeight: 900, textAlign: 'left', padding: '8px 10px' }}
            >
              مبلغ قابل پرداخت ({lbl})
            </td>
            <td
              style={{ ...cell, fontSize: grandFs, fontWeight: 900, textAlign: 'left', direction: 'ltr', padding: '8px 8px' }}
            >
              {formatMoney(totals.total, cur)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ── Amount in words ────────────────────────────────────────────── */}
      {customization.showAmountInWords && (
        <div
          style={{
            border: `1.5px solid ${RULE}`,
            borderTop: 'none',
            padding: '6px 10px',
            fontSize: wordsFs,
            display: 'flex',
            gap: '6px',
            alignItems: 'baseline',
          }}
        >
          <span style={{ fontWeight: 800, flexShrink: 0 }}>مبلغ به حروف:</span>
          <span style={{ lineHeight: 1.8 }}>{amountInWords(totals.total, cur)}</span>
        </div>
      )}

      {/* ── Notes ──────────────────────────────────────────────────────── */}
      {customization.showNotes && invoice.notes && (
        <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: '4px', marginTop: '8px', padding: '7px 10px' }}>
          <div style={{ fontSize: noteFs, fontWeight: 800, marginBottom: '2px' }}>توضیحات</div>
          <p style={{ fontSize: noteFs, margin: 0, lineHeight: 1.9, color: '#333', whiteSpace: 'pre-line' }}>
            {invoice.notes}
          </p>
        </div>
      )}

      <SignatureRow invoice={invoice} />

      {customization.showFooter && customization.footerText && (
        <div
          style={{
            marginTop: '12px',
            borderTop: `1px solid ${HAIRLINE}`,
            paddingTop: '6px',
            fontSize: noteFs,
            textAlign: 'center',
            color: '#444',
            lineHeight: 1.8,
            whiteSpace: 'pre-line',
          }}
        >
          {customization.footerText}
        </div>
      )}
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

const cell: React.CSSProperties = {
  border: `1px solid ${HAIRLINE}`,
  padding: '6px 8px',
  lineHeight: 1.6,
  height: '26px',
};

function MetaRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <tr>
      <td style={{ color: '#555', padding: '2px 0 2px 8px', whiteSpace: 'nowrap', textAlign: 'right' }}>{label}:</td>
      <td
        style={{
          fontWeight: 700,
          padding: '2px 0',
          whiteSpace: 'nowrap',
          direction: ltr ? 'ltr' : 'rtl',
          textAlign: 'left',
        }}
      >
        {value || '—'}
      </td>
    </tr>
  );
}

function PartyStrip({
  label, party, labelFs, fs,
}: { label: string; party: InvoiceData['seller']; labelFs: string; fs: string }) {
  const fields: [string, string][] = [
    ['نام', party.company || party.name || ''],
    ['شناسه / کد ملی', toPersianDigits(party.nationalId)],
    ['تلفن', toPersianDigits(party.phone)],
    ['نشانی', party.address],
  ];
  if (party.company && party.name) fields.splice(1, 0, ['نام مسئول', party.name]);
  if (party.email) fields.push(['ایمیل', party.email]);

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div
        style={{
          background: HEAD_FILL,
          fontSize: labelFs,
          fontWeight: 800,
          padding: '6px 8px',
          width: '86px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          borderLeft: `1px solid ${RULE}`,
          lineHeight: 1.5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: '6px 10px',
          fontSize: fs,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 16px',
          alignItems: 'baseline',
          lineHeight: 1.8,
        }}
      >
        {fields.map(([k, v]) => (
          <span
            key={k}
            style={{
              // Only the address is long enough to need wrapping
              whiteSpace: k === 'نشانی' ? 'normal' : 'nowrap',
              maxWidth: '100%',
            }}
          >
            <span style={{ color: '#777' }}>{k}: </span>
            <span style={{ fontWeight: 600, unicodeBidi: 'plaintext' }}>{v || '—'}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SumRow({ label, value, fs }: { label: string; value: string; fs: string }) {
  return (
    <tr>
      <td colSpan={5} style={{ ...cell, fontSize: fs, textAlign: 'left', fontWeight: 700 }}>
        {label}
      </td>
      <td style={{ ...cell, fontSize: fs, textAlign: 'left', direction: 'ltr', fontWeight: 700 }}>{value}</td>
    </tr>
  );
}
