'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { SectionCard } from '@/components/ui/SectionCard';
import { formatMoney, currencyLabel, toCurrencyUnit, fromCurrencyUnit, toPersianDigits } from '@/lib/utils';
import { Plus, Trash2, ShoppingCart, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InvoiceItem, UNIT_OPTIONS, DEFAULT_UNIT } from '@/types/invoice';
import { MAX_ITEMS } from '@/store/invoiceStore';

const UNIT_DATALIST_ID = 'invoice-unit-options';

function ItemRow({ item, index }: { item: InvoiceItem; index: number }) {
  const { invoice, updateItem, removeItem, duplicateItem } = useInvoiceStore();
  const currency = invoice.customization.currency;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-xl border border-gray-100 dark:border-slate-700/60 bg-gray-50/60 dark:bg-slate-800/30 p-2.5 mb-2 last:mb-0"
    >
      {/* Line 1 — index, description, row actions */}
      <div className="flex items-center gap-2 mb-2">
        <span className="flex-shrink-0 w-5 h-5 rounded-md bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-[10px] text-gray-500 dark:text-slate-400 font-medium flex items-center justify-center tabular-nums">
          {toPersianDigits(index + 1)}
        </span>
        <input
          className="input text-sm flex-1 py-1.5"
          value={item.name}
          onChange={(e) => updateItem(item.id, { name: e.target.value })}
          placeholder="شرح کالا یا خدمات"
        />
        <button
          onClick={() => duplicateItem(item.id)}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-slate-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          title="تکرار این ردیف"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => removeItem(item.id)}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="حذف ردیف"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Line 2 — quantity, unit, unit price (price gets the extra width) */}
      <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-2 pr-7">
        <label className="block">
          <span className="label !mb-1">تعداد</span>
          <input
            className="input text-xs text-center py-1.5"
            type="number"
            min="0"
            step="0.01"
            value={item.quantity || ''}
            onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
            placeholder="1"
            dir="ltr"
          />
        </label>

        {/* Free text with common suggestions */}
        <label className="block">
          <span className="label !mb-1">واحد</span>
          <input
            className="input text-xs text-center py-1.5"
            list={UNIT_DATALIST_ID}
            value={item.unit ?? ''}
            onChange={(e) => updateItem(item.id, { unit: e.target.value })}
            onBlur={(e) => {
              if (!e.target.value.trim()) updateItem(item.id, { unit: DEFAULT_UNIT });
            }}
            placeholder={DEFAULT_UNIT}
          />
        </label>

        <label className="block">
          <span className="label !mb-1">قیمت واحد ({currencyLabel(currency)})</span>
          <input
            className="input text-xs py-1.5"
            type="number"
            min="0"
            value={toCurrencyUnit(item.unitPrice, currency) || ''}
            onChange={(e) =>
              updateItem(item.id, {
                // Amounts are stored in rial regardless of the displayed unit.
                unitPrice: fromCurrencyUnit(Math.max(0, parseFloat(e.target.value) || 0), currency),
              })
            }
            placeholder="0"
            dir="ltr"
          />
        </label>
      </div>

      {/* Line 3 — computed row total, inline rather than as a fake input */}
      <div className="flex items-baseline justify-end gap-1.5 mt-2 pr-7">
        <span className="text-[11px] text-gray-400 dark:text-slate-500">جمع ردیف:</span>
        <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 tabular-nums">
          {formatMoney(item.total, currency)}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-slate-500">{currencyLabel(currency)}</span>
      </div>
    </motion.div>
  );
}

export function InvoiceItems() {
  const { invoice, addItem } = useInvoiceStore();
  const count = invoice.items.length;
  const atLimit = count >= MAX_ITEMS;

  return (
    <SectionCard
      title="اقلام فاکتور"
      step={3}
      icon={<ShoppingCart className="w-4 h-4" />}
      badge={count === 0 ? 'خالی' : `${toPersianDigits(count)} قلم`}
      badgeTone={count === 0 ? 'empty' : 'done'}
      collapsible
      defaultOpen
    >
      {/* Shared unit suggestions for every row */}
      <datalist id={UNIT_DATALIST_ID}>
        {UNIT_OPTIONS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      <AnimatePresence initial={false}>
        {invoice.items.map((item, index) => (
          <ItemRow key={item.id} item={item} index={index} />
        ))}
      </AnimatePresence>

      {count === 0 && (
        <div className="py-8 text-center">
          <div className="w-11 h-11 bg-gray-100 dark:bg-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-2.5">
            <ShoppingCart className="w-5 h-5 text-gray-300 dark:text-slate-500" />
          </div>
          <p className="text-sm text-gray-400 dark:text-slate-500">هنوز کالایی اضافه نشده</p>
          <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">برای شروع، یک ردیف اضافه کنید</p>
        </div>
      )}

      <div className={count > 0 ? 'mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/60' : 'mt-2'}>
        <div className="flex items-center gap-3">
          <button
            onClick={addItem}
            disabled={atLimit}
            className="btn-secondary text-xs flex-1 sm:flex-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            افزودن ردیف
          </button>
          <span
            className={`text-xs tabular-nums mr-auto ${
              atLimit ? 'text-amber-500 dark:text-amber-400 font-medium' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            {toPersianDigits(count)} / {toPersianDigits(MAX_ITEMS)}
            {atLimit && ' — حداکثر'}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
