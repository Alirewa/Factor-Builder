'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { FormField } from '@/components/ui/FormField';
import { formatMoney, currencyLabel, amountInWords, discountLabel, toCurrencyUnit, fromCurrencyUnit, cn } from '@/lib/utils';
import { CurrencyUnit, DiscountType, DISCOUNT_TYPE_LABELS } from '@/types/invoice';
import { Calculator } from 'lucide-react';

export function InvoiceTotals() {
  const { invoice, totals, updateInvoice } = useInvoiceStore();
  const currency = invoice.customization.currency;
  const unitLabel = currencyLabel(currency);
  const isPercent = invoice.globalDiscountType === 'percent';

  /**
   * A flat discount is entered in the displayed currency but stored in rial,
   * so switching between ریال and تومان never silently changes the amount.
   */
  const setDiscountType = (t: DiscountType) => {
    if (t === invoice.globalDiscountType) return;
    updateInvoice({ globalDiscountType: t, globalDiscount: 0 });
  };

  const clamp = (raw: string, max: number) =>
    Math.min(max, Math.max(0, parseFloat(raw) || 0));

  // Percent is unit-less; a flat amount is shown in whatever currency is active.
  const discountFieldValue = isPercent
    ? invoice.globalDiscount
    : toCurrencyUnit(invoice.globalDiscount, currency);

  return (
    <SectionCard
      title="مالیات، تخفیف و جمع کل"
      step={4}
      icon={<Calculator className="w-4 h-4" />}
      collapsible
      defaultOpen
    >
      {/* Tax */}
      <div className="mb-4">
        <FormField label="نرخ مالیات بر ارزش افزوده">
          <div className="relative">
            <input
              className="input pl-7 text-sm"
              type="number"
              min="0"
              max="100"
              value={invoice.taxRate}
              onChange={(e) => updateInvoice({ taxRate: clamp(e.target.value, 100) })}
              dir="ltr"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
          </div>
        </FormField>
      </div>

      {/* Discount — percentage or a flat amount */}
      <div className="mb-4">
        <label className="label">تخفیف کلی</label>

        <div className="flex gap-1 p-1 mb-2 rounded-xl bg-gray-100 dark:bg-slate-800/70">
          {(Object.keys(DISCOUNT_TYPE_LABELS) as DiscountType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDiscountType(t)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                invoice.globalDiscountType === t
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              )}
            >
              {DISCOUNT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            className="input pl-12 text-sm"
            type="number"
            min="0"
            max={isPercent ? 100 : undefined}
            value={discountFieldValue || ''}
            onChange={(e) =>
              updateInvoice({
                globalDiscount: isPercent
                  ? clamp(e.target.value, 100)
                  : fromCurrencyUnit(clamp(e.target.value, Infinity), currency),
              })
            }
            placeholder="0"
            dir="ltr"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {isPercent ? '%' : unitLabel}
          </span>
        </div>

        {!isPercent && totals.subtotal > 0 && invoice.globalDiscount > 0 && (
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5">
            معادل {discountLabel((totals.globalDiscountAmount / totals.subtotal) * 100, 'percent', currency)} از جمع اقلام
          </p>
        )}
      </div>

      {/* Totals summary card */}
      <div className="bg-gray-50 dark:bg-slate-700/25 rounded-xl p-4 space-y-2.5">
        <TotalRow label="جمع اقلام" value={totals.subtotal} currency={currency} />

        {totals.globalDiscountAmount > 0 && (
          <TotalRow
            label={`تخفیف کلی (${discountLabel(invoice.globalDiscount, invoice.globalDiscountType, currency)})`}
            value={totals.globalDiscountAmount}
            currency={currency}
            type="discount"
          />
        )}
        {totals.taxAmount > 0 && (
          <TotalRow
            label={`مالیات (${invoice.taxRate}%)`}
            value={totals.taxAmount}
            currency={currency}
            type="tax"
          />
        )}

        <div className="pt-2.5 mt-1 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900 dark:text-slate-100">قابل پرداخت</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {formatMoney(totals.total, currency)}
            </span>
            <span className="text-xs text-gray-400 dark:text-slate-500">{unitLabel}</span>
          </div>
        </div>

        {invoice.customization.showAmountInWords && totals.total > 0 && (
          <p className="pt-1 text-[11px] leading-relaxed text-gray-500 dark:text-slate-400">
            <span className="text-gray-400 dark:text-slate-500">به حروف: </span>
            {amountInWords(totals.total, currency)}
          </p>
        )}
      </div>

    </SectionCard>
  );
}

function TotalRow({
  label,
  value,
  currency,
  type,
}: {
  label: string;
  value: number;
  currency: CurrencyUnit;
  type?: 'discount' | 'tax';
}) {
  const color =
    type === 'discount'
      ? 'text-emerald-600 dark:text-emerald-400'
      : type === 'tax'
      ? 'text-orange-500 dark:text-orange-400'
      : 'text-gray-700 dark:text-slate-300';

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm">{label}</span>
      <span className={`tabular-nums font-medium text-xs sm:text-sm ${color}`}>
        {type === 'discount' ? '−' : type === 'tax' ? '+' : ''}
        {formatMoney(value, currency)}{' '}
        <span className="text-gray-400 dark:text-slate-500 font-normal">{currencyLabel(currency)}</span>
      </span>
    </div>
  );
}
