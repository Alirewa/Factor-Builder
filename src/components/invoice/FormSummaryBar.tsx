'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { formatMoney, currencyLabel, toPersianDigits } from '@/lib/utils';
import { Eye } from 'lucide-react';

interface Props {
  /** Shown only on mobile, where the preview lives behind a tab. */
  onShowPreview?: () => void;
}

/**
 * Pinned to the bottom of the form panel so the payable amount is readable
 * without scrolling back to the totals card.
 */
export function FormSummaryBar({ onShowPreview }: Props) {
  const { invoice, totals } = useInvoiceStore();
  const currency = invoice.customization.currency;
  const count = invoice.items.length;

  return (
    <div className="no-print sticky bottom-0 z-20 border-t border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-tight">
            {count === 0 ? 'بدون قلم' : `${toPersianDigits(count)} قلم`}
          </p>
          <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 leading-tight">
            قابل پرداخت
          </p>
        </div>

        <div className="flex items-baseline gap-1 mr-auto min-w-0">
          <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums truncate">
            {formatMoney(totals.total, currency)}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-slate-500 flex-shrink-0">
            {currencyLabel(currency)}
          </span>
        </div>

        {onShowPreview && (
          <button
            onClick={onShowPreview}
            className="lg:hidden btn-secondary text-xs px-2.5 py-1.5 flex-shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            پیش‌نمایش
          </button>
        )}
      </div>
    </div>
  );
}
