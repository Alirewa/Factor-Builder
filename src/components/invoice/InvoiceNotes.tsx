'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { StickyNote } from 'lucide-react';
import { toPersianDigits } from '@/lib/utils';

const MAX_NOTES = 400;

/**
 * Notes used to live inside the totals card, which mixed money with prose.
 * It gets its own step so the totals card is only about numbers.
 */
export function InvoiceNotes() {
  const { invoice, updateInvoice } = useInvoiceStore();
  const notes = invoice.notes;

  return (
    <SectionCard
      title="توضیحات فاکتور"
      step={5}
      icon={<StickyNote className="w-4 h-4" />}
      badge={notes ? 'نوشته شده' : 'اختیاری'}
      badgeTone={notes ? 'done' : 'neutral'}
      hint="شرایط پرداخت، مدت گارانتی، نحوه تحویل — هرچه اینجا بنویسید پایین فاکتور چاپ می‌شود."
      collapsible
      defaultOpen={false}
    >
      <textarea
        className="input resize-none text-sm leading-relaxed"
        rows={4}
        value={notes}
        maxLength={MAX_NOTES}
        onChange={(e) => updateInvoice({ notes: e.target.value })}
        placeholder="مثال: گارانتی ۱۸ ماهه شرکتی — تحویل کالا در محل خریدار"
      />
      <div className="flex justify-end mt-1.5">
        <span className="text-[10px] text-gray-400 dark:text-slate-500 tabular-nums">
          {toPersianDigits(notes.length)} / {toPersianDigits(MAX_NOTES)}
        </span>
      </div>
    </SectionCard>
  );
}
