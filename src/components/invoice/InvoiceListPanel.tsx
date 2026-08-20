'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, FolderOpen, Trash2, Download, FilePlus, FileText,
  AlertCircle, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { INVOICE_TYPE_LABELS, MAX_SAVED_INVOICES } from '@/types/invoice';
import { formatMoney, currencyLabel, toJalali } from '@/lib/utils';
import { exportInvoiceToPDF } from '@/lib/pdfExport';
import { useState } from 'react';

export function InvoiceListPanel() {
  const {
    isInvoiceListOpen,
    toggleInvoiceList,
    savedInvoices,
    saveCurrentInvoice,
    loadSavedInvoice,
    deleteSavedInvoice,
    updateSavedInvoice,
  } = useInvoiceStore();

  const [exportingId, setExportingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isFull = savedInvoices.length >= MAX_SAVED_INVOICES;

  /* ── Save current invoice ── */
  const handleSave = () => {
    if (isFull) {
      toast.error(`حداکثر ${MAX_SAVED_INVOICES} فاکتور قابل ذخیره است. ابتدا یکی را حذف کنید.`);
      return;
    }
    const si = saveCurrentInvoice();
    if (si) {
      toast.success('فاکتور ذخیره شد');
    }
  };

  /* ── Load ── */
  const handleLoad = (id: string, label: string) => {
    loadSavedInvoice(id);
    toast.success(`«${label}» بارگذاری شد`);
  };

  /* ── Update (overwrite) ── */
  const handleUpdate = (id: string) => {
    updateSavedInvoice(id);
    toast.success('فاکتور به‌روز شد');
  };

  /* ── Delete ── */
  const handleDelete = (id: string) => {
    deleteSavedInvoice(id);
    setConfirmDeleteId(null);
    toast(`فاکتور حذف شد`, { icon: '🗑️' });
  };

  /* ── Export PDF ── */
  const handleExport = async (id: string, invoiceNumber: string) => {
    loadSavedInvoice(id); // load saved invoice into store → preview re-renders
    setExportingId(id);
    // Wait two frames so React re-renders the template before capture
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    const t = toast.loading('در حال ساخت PDF...');
    try {
      await exportInvoiceToPDF(invoiceNumber);
      toast.success('PDF دانلود شد', { id: t });
    } catch {
      toast.error('خطا در ساخت PDF', { id: t });
    } finally {
      setExportingId(null);
    }
  };

  const sorted = [...savedInvoices].sort((a, b) => b.savedAt - a.savedAt);

  return (
    <AnimatePresence>
      {isInvoiceListOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleInvoiceList}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 no-print"
          />

          {/* Drawer — slides from left (end side in RTL layout) */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-0 top-0 h-full z-50 no-print flex flex-col
                       w-full max-w-[380px] sm:max-w-[420px]
                       bg-white dark:bg-slate-900
                       shadow-2xl border-r border-gray-200 dark:border-slate-700"
          >
            {/* ── Panel header ── */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">فاکتورهای ذخیره‌شده</h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  isFull
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-500'
                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {savedInvoices.length}/{MAX_SAVED_INVOICES}
                </span>
              </div>
              <button onClick={toggleInvoiceList} className="btn-ghost p-1.5 -mr-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Save current button ── */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={isFull}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-98 ${
                  isFull
                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                }`}
              >
                <Save className="w-4 h-4" />
                ذخیره فاکتور فعلی
              </button>
              {isFull && (
                <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1.5 px-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  ظرفیت پر شده — برای ذخیره جدید، یک فاکتور حذف کنید
                </p>
              )}
            </div>

            {/* ── List ── */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
                  <FilePlus className="w-10 h-10 text-gray-200 dark:text-slate-700" />
                  <p className="text-sm text-gray-400 dark:text-slate-500">
                    هنوز فاکتوری ذخیره نشده
                  </p>
                  <p className="text-xs text-gray-300 dark:text-slate-600 max-w-[220px]">
                    با کلیک روی «ذخیره فاکتور فعلی» فاکتور جاری را ذخیره کنید
                  </p>
                </div>
              ) : (
                sorted.map((si) => (
                  <div
                    key={si.id}
                    className="group relative rounded-xl border border-gray-100 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-blue-200 dark:hover:border-blue-700/50 transition-all overflow-hidden"
                  >
                    {/* Type badge strip */}
                    <div
                      className="h-1 w-full"
                      style={{
                        background: si.invoiceType === 'sale' ? '#3b82f6' : '#7c3aed',
                      }}
                    />

                    <div className="p-3">
                      {/* Row 1: type + buyer + date */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                              si.invoiceType === 'sale'
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            }`}>
                              {INVOICE_TYPE_LABELS[si.invoiceType]}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500 dark:text-slate-400 truncate">
                              {si.invoiceNumber}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 mt-1 truncate">
                            {si.buyerName}
                          </p>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <p className="text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {toJalali(si.invoiceDate)}
                          </p>
                          <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5 direction-ltr">
                            {formatMoney(si.total, si.data.customization.currency)}{' '}
                            {currencyLabel(si.data.customization.currency)}
                          </p>
                        </div>
                      </div>

                      {/* Row 2: action buttons */}
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50 dark:border-slate-700/60">
                        {/* Load */}
                        <button
                          onClick={() => handleLoad(si.id, si.buyerName || si.invoiceNumber)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          بارگذاری
                        </button>

                        {/* Update (overwrite) */}
                        <button
                          onClick={() => handleUpdate(si.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-slate-700/60 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          title="بازنویسی با فاکتور فعلی"
                        >
                          <Save className="w-3.5 h-3.5" />
                          به‌روزرسانی
                        </button>

                        {/* Export PDF */}
                        <button
                          onClick={() => handleExport(si.id, si.invoiceNumber)}
                          disabled={exportingId === si.id}
                          className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-40"
                          title="دانلود PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        {confirmDeleteId === si.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(si.id)}
                              className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              حذف
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-lg text-[11px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              لغو
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(si.id)}
                            className="p-1.5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="حذف فاکتور"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Footer hint ── */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
              <p className="text-[11px] text-gray-400 dark:text-slate-600 text-center">
                داده‌ها به‌صورت محلی در مرورگر ذخیره می‌شوند
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
