'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { FormField } from '@/components/ui/FormField';
import { SectionCard } from '@/components/ui/SectionCard';
import { JalaliDatePicker } from '@/components/ui/JalaliDatePicker';
import { InvoiceType } from '@/types/invoice';
import { FileText, ClipboardList, RotateCcw } from 'lucide-react';

const TYPES: { value: InvoiceType; label: string; icon: React.ReactNode }[] = [
  { value: 'sale',     label: 'فاکتور فروش',   icon: <FileText className="w-3.5 h-3.5" /> },
  { value: 'proforma', label: 'پیش‌فاکتور',    icon: <ClipboardList className="w-3.5 h-3.5" /> },
];

export function InvoiceHeader() {
  const { invoice, updateInvoice, toggleResetModal } = useInvoiceStore();

  const resetButton = (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggleResetModal(); }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      title="پاک کردن فاکتور"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">پاک کردن</span>
    </button>
  );

  return (
    <SectionCard
      title="اطلاعات فاکتور"
      step={1}
      icon={<FileText className="w-4 h-4" />}
      headerAction={resetButton}
      collapsible
      defaultOpen
    >
      {/* Invoice type selector */}
      <div className="mb-4">
        <label className="label">نوع سند</label>
        <div className="flex gap-2">
          {TYPES.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateInvoice({ invoiceType: value })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border-2 transition-all ${
                invoice.invoiceType === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Number + Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="شماره فاکتور" required>
          <input
            className="input"
            value={invoice.invoiceNumber}
            onChange={(e) => updateInvoice({ invoiceNumber: e.target.value })}
            placeholder="INV-20240101-1234"
            dir="ltr"
          />
        </FormField>

        <FormField label="تاریخ صدور" required>
          <JalaliDatePicker
            value={invoice.invoiceDate}
            onChange={(iso) => updateInvoice({ invoiceDate: iso })}
            placeholder="انتخاب تاریخ"
          />
        </FormField>
      </div>
    </SectionCard>
  );
}
