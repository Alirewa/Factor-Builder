'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Type, Coins } from 'lucide-react';
import { CurrencyUnit } from '@/types/invoice';



const CURRENCIES: { id: CurrencyUnit; label: string }[] = [
  { id: 'rial',  label: 'ریال' },
  { id: 'toman', label: 'تومان' },
];

export function CustomizationPanel() {
  const { isCustomizationOpen, toggleCustomization, invoice, updateCustomization } = useInvoiceStore();
  const c = invoice.customization;

  return (
    <AnimatePresence>
      {isCustomizationOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCustomization}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 no-print"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 h-full z-50 no-print flex flex-col
                       w-full max-w-[320px] sm:max-w-[340px]
                       bg-white dark:bg-slate-900
                       shadow-2xl border-l border-gray-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">تنظیمات فاکتور</h3>
              <button onClick={toggleCustomization} className="btn-ghost p-1.5 -ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">

              <p className="text-[11px] leading-relaxed text-gray-400 dark:text-slate-500 rounded-lg bg-gray-50 dark:bg-slate-800/60 px-3 py-2">
                قالب و رنگ فاکتور از نوار بالای پیش‌نمایش انتخاب می‌شوند.
              </p>

              {/* Template */}
              <Section icon={<Coins className="w-3.5 h-3.5" />} title="واحد پول">
                <div className="flex gap-2">
                  {CURRENCIES.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => updateCustomization({ currency: id })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                        c.currency === id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5">
                  مبالغ به ریال وارد می‌شوند؛ با انتخاب تومان، نمایش فاکتور تقسیم بر ۱۰ می‌شود.
                </p>
              </Section>

              {/* Font size */}
              <Section icon={<Type className="w-3.5 h-3.5" />} title="اندازه متن">
                <div className="flex gap-2">
                  {([['sm', 'کوچک'], ['md', 'متوسط'], ['lg', 'بزرگ']] as const).map(([size, label]) => (
                    <button
                      key={size}
                      onClick={() => updateCustomization({ fontSize: size })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                        c.fontSize === size
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Visibility */}
              <Section icon={<Eye className="w-3.5 h-3.5" />} title="نمایش بخش‌ها">
                <div className="space-y-1">
                  {([
                    ['showTax',           'نمایش مالیات'],
                    ['showDiscount',      'نمایش تخفیف'],
                    ['showNotes',         'نمایش توضیحات'],
                    ['showAmountInWords', 'نمایش مبلغ به حروف'],
                    ['showBismillah',     'نمایش «بسمه تعالی»'],
                    ['showFooter',        'نمایش فوتر تماس'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer py-1.5 rounded-lg px-1 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                      <span className="text-sm text-gray-600 dark:text-slate-400">{label}</span>
                      <Toggle
                        checked={c[key]}
                        onChange={(v) => updateCustomization({ [key]: v })}
                      />
                    </label>
                  ))}
                </div>

                {/* Footer text area — shown when footer toggle is on */}
                {c.showFooter && (
                  <div className="mt-3">
                    <label className="label mb-1.5">متن فوتر</label>
                    <textarea
                      value={c.footerText}
                      onChange={(e) => updateCustomization({ footerText: e.target.value })}
                      placeholder="آدرس، تلفن، وب‌سایت..."
                      rows={3}
                      className="input resize-none text-xs leading-relaxed"
                    />
                  </div>
                )}
              </Section>

              <p className="text-[10px] leading-relaxed text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-3">
                مهر و امضا فقط در صورت آپلود تصویر روی فاکتور چاپ می‌شود — بدون خط یا برچسب خالی.
              </p>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-blue-500 dark:text-blue-400">{icon}</span>
        <h4 className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
      style={{ width: 40, height: 22, background: checked ? '#3b82f6' : '#d1d5db' }}
    >
      <span
        className="absolute top-0.5 bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ width: 18, height: 18, transform: checked ? 'translateX(19px)' : 'translateX(2px)' }}
      />
    </button>
  );
}
