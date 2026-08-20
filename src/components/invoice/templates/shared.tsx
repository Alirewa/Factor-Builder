'use client';

import { createContext, useContext } from 'react';
import {
  InvoiceData, InvoiceTotals, InvoiceCustomization,
  INVOICE_TYPE_TITLES, DEFAULT_UNIT,
} from '@/types/invoice';
import { formatMoney, formatQuantity, formatPercent, discountLabel, currencyLabel, amountInWords, toJalali, toPersianDigits } from '@/lib/utils';

// ─── Font scaling ────────────────────────────────────────────────────────────
// The old templates used CSS `zoom` on the print root. `zoom` gets copied onto
// *every* cloned node by html-to-image, so it compounded through the tree and
// wrecked the PDF. Instead we multiply font sizes explicitly through a context.
// ─────────────────────────────────────────────────────────────────────────────

const ScaleContext = createContext(1);

export const ScaleProvider = ScaleContext.Provider;

export function fontScale(size: InvoiceCustomization['fontSize']): number {
  return size === 'sm' ? 0.9 : size === 'lg' ? 1.12 : 1;
}

/** Scaled font size — `fontSize: useFs(12)` */
export function useFs(px: number): string {
  const s = useContext(ScaleContext);
  return `${+(px * s).toFixed(2)}px`;
}

/** Wraps a template body so every descendant picks up the font scale. */
export function TemplateRoot({
  invoice,
  children,
  style,
}: {
  invoice: InvoiceData;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const scale = fontScale(invoice.customization.fontSize);
  return (
    <ScaleProvider value={scale}>
      <div
        id="invoice-print-root"
        style={{
          fontFamily: 'Vazirmatn, Tahoma, sans-serif',
          direction: 'rtl',
          background: '#ffffff',
          color: '#0f172a',
          width: '100%',
          ...style,
        }}
      >
        {invoice.customization.showBismillah && <Bismillah />}
        {children}
      </div>
    </ScaleProvider>
  );
}

/**
 * «بسمه تعالی» — سربرگ مرسوم فاکتورهای رسمی ایرانی
 *
 * No `letter-spacing` anywhere in these templates: Persian is a connected
 * script and any tracking breaks the joins between letters.
 */
export function Bismillah() {
  return (
    <div
      style={{
        textAlign: 'center',
        fontSize: useFs(10),
        color: '#64748b',
        paddingTop: '8px',
      }}
    >
      بسمه تعالی
    </div>
  );
}

// ─── Header (shared by all templates) ───────────────────────────────────────
// Layout (RTL):
//   Right col  : لوگو + نام فروشگاه/برند + نام مسئول
//   Center col : عنوان رسمی سند (صورتحساب فروش کالا و خدمات)
//   Left col   : شماره + تاریخ صدور
// ─────────────────────────────────────────────────────────────────────────────

interface HeaderProps {
  invoice: InvoiceData;
  primary: string;
  dark?: boolean; // dark-background variant (for corporate template)
}

export function InvoiceHeaderBlock({ invoice, primary, dark = false }: HeaderProps) {
  const { customization, seller } = invoice;
  const textColor = dark ? '#ffffff' : '#0f172a';
  const mutedColor = dark ? 'rgba(255,255,255,0.65)' : '#64748b';
  const title = INVOICE_TYPE_TITLES[invoice.invoiceType];

  const brandFs = useFs(customization.logoImage ? 16 : 19);
  const subFs = useFs(10);
  const titleFs = useFs(13);
  const metaFs = useFs(11);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 24px',
        background: dark ? primary : `${primary}0F`,
        borderBottom: dark ? 'none' : `2px solid ${primary}`,
      }}
    >
      {/* ── Right: logo + brand ── */}
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {customization.logoImage && (
          <img
            src={customization.logoImage}
            alt=""
            style={{ height: '46px', maxWidth: '110px', objectFit: 'contain', flexShrink: 0 }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: brandFs, fontWeight: 900, color: dark ? '#ffffff' : primary, lineHeight: 1.3 }}>
            {seller.company || seller.name || 'نام فروشگاه / برند'}
          </div>
          {seller.company && seller.name && (
            <div style={{ fontSize: subFs, color: mutedColor, marginTop: '2px' }}>{seller.name}</div>
          )}
        </div>
      </div>

      {/* ── Center: official document title ── */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-block',
            background: dark ? 'rgba(255,255,255,0.15)' : primary,
            color: '#ffffff',
            fontSize: titleFs,
            fontWeight: 800,
            padding: '7px 18px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
      </div>

      {/* ── Left: number + dates ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <table style={{ fontSize: metaFs, borderCollapse: 'collapse' }}>
          <tbody>
            <MetaRow label="شماره" value={invoice.invoiceNumber} muted={mutedColor} color={textColor} ltr />
            <MetaRow label="تاریخ صدور" value={toJalali(invoice.invoiceDate)} muted={mutedColor} color={textColor} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetaRow({
  label, value, muted, color, ltr,
}: { label: string; value: string; muted: string; color: string; ltr?: boolean }) {
  return (
    <tr>
      <td style={{ color: muted, padding: '2px 0 2px 8px', whiteSpace: 'nowrap', textAlign: 'right' }}>{label}:</td>
      <td
        style={{
          fontWeight: 700,
          color,
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

// ─── Party box (shared) ──────────────────────────────────────────────────────
export function PartyBox({
  party, label, primary,
}: { party: InvoiceData['seller']; label: string; primary: string }) {
  const labelFs = useFs(10.5);
  const nameFs = useFs(12.5);
  const bodyFs = useFs(11);

  const title = party.company || party.name;
  const rows: [string, string][] = [];
  if (party.company && party.name) rows.push(['نام مسئول', party.name]);
  if (party.nationalId) rows.push(['شناسه / کد ملی', toPersianDigits(party.nationalId)]);
  if (party.phone) rows.push(['تلفن', toPersianDigits(party.phone)]);
  if (party.email) rows.push(['ایمیل', party.email]);
  if (party.address) rows.push(['نشانی', party.address]);

  return (
    <div style={{ border: `1px solid ${primary}33`, borderRadius: '6px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
      <div style={{ background: primary, color: '#fff', fontSize: labelFs, fontWeight: 700, padding: '5px 10px' }}>
        مشخصات {label}
      </div>
      <div style={{ padding: '7px 10px', fontSize: bodyFs, lineHeight: 1.75 }}>
        <div style={{ fontWeight: 700, fontSize: nameFs, marginBottom: rows.length ? '2px' : 0 }}>
          {title || <span style={{ color: '#cbd5e1' }}>تکمیل نشده</span>}
        </div>
        {rows.map(([k, v]) => (
          <div key={k} style={{ color: '#475569', display: 'flex', gap: '5px' }}>
            <span style={{ color: '#94a3b8', flexShrink: 0 }}>{k}:</span>
            <span style={{ unicodeBidi: 'plaintext' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Items table (shared) ────────────────────────────────────────────────────
export function ItemsTable({
  invoice,
  primary,
  alternateRow = '#f8fafc',
}: {
  invoice: InvoiceData;
  primary: string;
  alternateRow?: string;
}) {
  const { items, customization } = invoice;
  const cur = customization.currency;
  const unitLbl = currencyLabel(cur);

  const headFs = useFs(10.5);
  const cellFs = useFs(11);

  const columns: { label: string; align: 'right' | 'center' | 'left'; width?: string }[] = [
    { label: 'ردیف',                  align: 'center', width: '34px' },
    { label: 'شرح کالا / خدمات',       align: 'right' },
    { label: 'تعداد',                  align: 'center', width: '52px' },
    { label: 'واحد',                   align: 'center', width: '64px' },
    { label: `مبلغ واحد (${unitLbl})`, align: 'left',   width: '106px' },
    { label: `مبلغ کل (${unitLbl})`,   align: 'left',   width: '112px' },
  ];

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <colgroup>
        {columns.map((c) => (
          <col key={c.label} style={c.width ? { width: c.width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr style={{ background: primary }}>
          {columns.map((c) => (
            <th
              key={c.label}
              style={{
                padding: '7px 8px',
                color: '#ffffff',
                fontSize: headFs,
                fontWeight: 700,
                textAlign: c.align,
                whiteSpace: 'nowrap',
              }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ padding: '18px', textAlign: 'center', color: '#94a3b8', fontSize: cellFs }}>
              هیچ کالایی ثبت نشده است
            </td>
          </tr>
        ) : (
          items.map((item, i) => (
            <tr
              key={item.id}
              style={{ background: i % 2 === 0 ? '#ffffff' : alternateRow, borderBottom: '1px solid #eef2f7' }}
            >
              <td style={{ ...tdS, fontSize: cellFs, textAlign: 'center', color: '#94a3b8' }}>{i + 1}</td>
              <td style={{ ...tdS, fontSize: cellFs, textAlign: 'right', wordBreak: 'break-word' }}>{item.name}</td>
              <td style={{ ...tdS, fontSize: cellFs, textAlign: 'center' }}>{formatQuantity(item.quantity)}</td>
              <td style={{ ...tdS, fontSize: cellFs, textAlign: 'center', color: '#475569' }}>{item.unit || DEFAULT_UNIT}</td>
              <td style={{ ...tdS, fontSize: cellFs, textAlign: 'left', direction: 'ltr' }}>{formatMoney(item.unitPrice, cur)}</td>
              <td style={{ ...tdS, fontSize: cellFs, textAlign: 'left', direction: 'ltr', fontWeight: 700 }}>
                {formatMoney(item.total, cur)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ─── Totals summary (shared) ─────────────────────────────────────────────────
export function TotalsSummary({
  invoice,
  totals,
  primary,
}: {
  invoice: InvoiceData;
  totals: InvoiceTotals;
  primary: string;
}) {
  const cur = invoice.customization.currency;
  const lbl = currencyLabel(cur);
  const bodyFs = useFs(11.5);
  const grandLabelFs = useFs(12.5);
  const grandFs = useFs(15);

  return (
    <div style={{ fontSize: bodyFs }}>
      <TRow label="جمع اقلام" value={`${formatMoney(totals.subtotal, cur)} ${lbl}`} />
      {invoice.customization.showDiscount && totals.globalDiscountAmount > 0 && (
        <TRow
          label={`تخفیف (${discountLabel(invoice.globalDiscount, invoice.globalDiscountType, cur)})`}
          value={`−${formatMoney(totals.globalDiscountAmount, cur)} ${lbl}`}
          color="#16a34a"
        />
      )}
      {invoice.customization.showTax && totals.taxAmount > 0 && (
        <TRow
          label={`مالیات بر ارزش افزوده (${formatPercent(invoice.taxRate)})`}
          value={`+${formatMoney(totals.taxAmount, cur)} ${lbl}`}
          color="#ea580c"
        />
      )}
      <div
        style={{
          marginTop: '7px',
          paddingTop: '7px',
          borderTop: `2px solid ${primary}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontWeight: 800, fontSize: grandLabelFs, whiteSpace: 'nowrap' }}>مبلغ قابل پرداخت</span>
        <span style={{ fontWeight: 800, fontSize: grandFs, color: primary, direction: 'ltr', whiteSpace: 'nowrap' }}>
          {formatMoney(totals.total, cur)} {lbl}
        </span>
      </div>
    </div>
  );
}

/** «مبلغ به حروف» — بند مرسوم فاکتورهای ایرانی */
export function AmountInWords({ invoice, totals }: { invoice: InvoiceData; totals: InvoiceTotals }) {
  const labelFs = useFs(10.5);
  const valueFs = useFs(11.5);
  if (!invoice.customization.showAmountInWords) return null;

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '7px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        background: '#f8fafc',
        display: 'flex',
        gap: '6px',
        alignItems: 'baseline',
      }}
    >
      <span style={{ fontSize: labelFs, color: '#64748b', fontWeight: 700, flexShrink: 0 }}>مبلغ به حروف:</span>
      <span style={{ fontSize: valueFs, color: '#0f172a', fontWeight: 600, lineHeight: 1.7 }}>
        {amountInWords(totals.total, invoice.customization.currency)}
      </span>
    </div>
  );
}

// ─── Signature area (shared) ─────────────────────────────────────────────────
// Only rendered when the user actually uploaded a signature or a stamp — no
// placeholder lines and no caption under an empty box.
// ─────────────────────────────────────────────────────────────────────────────
export function SignatureRow({ invoice }: { invoice: InvoiceData }) {
  const { signature } = invoice;
  const hasSignature = Boolean(signature.signatureImage);
  const hasStamp = Boolean(signature.stampImage);
  if (!hasSignature && !hasStamp) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        gap: '24px',
        marginTop: '14px',
      }}
    >
      {hasSignature && (
        <img src={signature.signatureImage!} alt="" style={{ height: '62px', maxWidth: '170px', objectFit: 'contain' }} />
      )}
      {hasStamp && (
        <img src={signature.stampImage!} alt="" style={{ height: '72px', maxWidth: '170px', objectFit: 'contain' }} />
      )}
    </div>
  );
}

function TRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: color || '#1e293b', fontWeight: 600, direction: 'ltr', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

const tdS: React.CSSProperties = {
  padding: '6px 8px',
  lineHeight: 1.5,
};

// ─── Footer contact info (shared) ────────────────────────────────────────────
export function InvoiceFooter({ invoice, primary }: { invoice: InvoiceData; primary: string }) {
  const fs = useFs(10);
  if (!invoice.customization.showFooter || !invoice.customization.footerText) return null;
  return (
    <div
      style={{
        borderTop: `1px solid ${primary}33`,
        padding: '7px 24px',
        fontSize: fs,
        color: '#64748b',
        textAlign: 'center',
        background: `${primary}08`,
        lineHeight: 1.7,
        whiteSpace: 'pre-line',
      }}
    >
      {invoice.customization.footerText}
    </div>
  );
}

// ─── Notes block (shared) ────────────────────────────────────────────────────
export function NotesBlock({ invoice, primary }: { invoice: InvoiceData; primary: string }) {
  const labelFs = useFs(10.5);
  const bodyFs = useFs(11);
  if (!invoice.customization.showNotes || !invoice.notes) return null;
  return (
    <div style={{ padding: '9px 11px', border: `1px solid ${primary}26`, borderRadius: '6px', background: `${primary}06` }}>
      <div style={{ fontSize: labelFs, fontWeight: 700, color: primary, marginBottom: '3px' }}>توضیحات</div>
      <p style={{ fontSize: bodyFs, color: '#475569', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>
        {invoice.notes}
      </p>
    </div>
  );
}
