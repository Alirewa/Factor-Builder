'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { InvoiceTemplate } from '@/types/invoice';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

/**
 * Template and colour live in the settings drawer too, but switching them is
 * the one thing people do while *looking* at the preview — so the same controls
 * sit right above it.
 */

export const PREVIEW_TEMPLATES: { id: InvoiceTemplate; label: string }[] = [
  { id: 'store',     label: 'فروشگاهی' },
  { id: 'formal',    label: 'رسمی' },
  { id: 'modern',    label: 'مدرن' },
  { id: 'corporate', label: 'شرکتی' },
  { id: 'minimal',   label: 'مینیمال' },
];

export const PREVIEW_COLORS: { hex: string; name: string }[] = [
  { hex: '#1f2937', name: 'زغالی (مناسب چاپ)' },
  { hex: '#2563eb', name: 'آبی' },
  { hex: '#0891b2', name: 'فیروزه‌ای' },
  { hex: '#059669', name: 'سبز' },
  { hex: '#7c3aed', name: 'بنفش' },
  { hex: '#dc2626', name: 'قرمز' },
  { hex: '#ea580c', name: 'نارنجی' },
];

export function PreviewToolbar() {
  const { invoice, updateCustomization } = useInvoiceStore();
  const { template, primaryColor } = invoice.customization;

  // The monochrome store template ignores primaryColor by design.
  const colorApplies = template !== 'store';

  return (
    <div className="no-print flex-shrink-0 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60">
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-thin">
        {/* Templates */}
        <span className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0">قالب</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {PREVIEW_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => updateCustomization({ template: t.id })}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-all active:scale-95',
                template === t.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-gray-200 dark:bg-slate-700 flex-shrink-0 mx-0.5" />

        {/* Colour */}
        <span className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0">رنگ</span>
        <div
          className={cn(
            'flex items-center gap-1.5 flex-shrink-0 transition-opacity',
            !colorApplies && 'opacity-40'
          )}
          title={colorApplies ? undefined : 'قالب فروشگاهی سیاه‌سفید است و رنگ نمی‌گیرد'}
        >
          {PREVIEW_COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => updateCustomization({ primaryColor: c.hex })}
              title={c.name}
              aria-label={c.name}
              className="w-5 h-5 rounded-full flex items-center justify-center transition-transform active:scale-90 flex-shrink-0"
              style={{
                background: c.hex,
                outline: primaryColor === c.hex ? `2px solid ${c.hex}` : 'none',
                outlineOffset: '2px',
              }}
            >
              {primaryColor === c.hex && <Check className="w-3 h-3 text-white" />}
            </button>
          ))}

          <label
            className="w-5 h-5 rounded-full flex-shrink-0 cursor-pointer border border-gray-300 dark:border-slate-600 overflow-hidden"
            title="رنگ سفارشی"
            style={{ background: 'conic-gradient(#ef4444,#eab308,#22c55e,#3b82f6,#a855f7,#ef4444)' }}
          >
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => updateCustomization({ primaryColor: e.target.value })}
              className="opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
