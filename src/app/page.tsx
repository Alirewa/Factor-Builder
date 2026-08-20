'use client';

import { useState, useCallback } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Navbar } from '@/components/layout/Navbar';
import { InvoiceHeader } from '@/components/invoice/InvoiceHeader';
import { PartiesCard } from '@/components/invoice/PartyForm';
import { InvoiceItems } from '@/components/invoice/InvoiceItems';
import { InvoiceTotals } from '@/components/invoice/InvoiceTotals';
import { InvoiceNotes } from '@/components/invoice/InvoiceNotes';
import { FormSummaryBar } from '@/components/invoice/FormSummaryBar';
import { SignatureUpload } from '@/components/invoice/SignatureUpload';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { CustomizationPanel } from '@/components/invoice/CustomizationPanel';
import { InvoiceListPanel } from '@/components/invoice/InvoiceListPanel';
import { ResetModal } from '@/components/ui/ResetModal';
import { LicenseGate } from '@/components/LicenseGate';
import { useInvoiceStore } from '@/store/invoiceStore';
import { exportInvoiceToPDF, exportInvoiceToImage, printInvoice } from '@/lib/pdfExport';
import { getInvoiceIssues } from '@/lib/validation';
import toast from 'react-hot-toast';
import { Eye, PenLine } from 'lucide-react';

type Tab = 'form' | 'preview';

export default function Home() {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const { invoice, totals } = useInvoiceStore();
  useAutoSave(60000);

  /** Refuses obviously-empty invoices and surfaces softer problems as a warning. */
  const passesChecks = useCallback(() => {
    const { blocking, advisory } = getInvoiceIssues(invoice, totals);
    if (blocking.length > 0) {
      toast.error(blocking[0], { duration: 4000 });
      return false;
    }
    if (advisory.length > 0) {
      toast(advisory.join(' • '), { icon: '⚠️', duration: 4000 });
    }
    return true;
  }, [invoice, totals]);

  const runExport = useCallback(
    async (format: 'pdf' | 'jpeg') => {
      if (!passesChecks()) return;
      const label = format === 'pdf' ? 'PDF' : 'تصویر';
      setIsExporting(true);
      const t = toast.loading(`در حال ساخت ${label}...`);
      try {
        if (format === 'pdf') await exportInvoiceToPDF(invoice.invoiceNumber);
        else await exportInvoiceToImage(invoice.invoiceNumber);
        toast.success(`${label} با موفقیت دانلود شد`, { id: t });
      } catch (err) {
        console.error(err);
        toast.error(`خطا در ساخت ${label}`, { id: t });
      } finally {
        setIsExporting(false);
      }
    },
    [invoice.invoiceNumber, passesChecks]
  );

  const handleExportPDF   = useCallback(() => runExport('pdf'),  [runExport]);
  const handleExportImage = useCallback(() => runExport('jpeg'), [runExport]);

  const handlePrint = useCallback(() => {
    if (passesChecks()) printInvoice();
  }, [passesChecks]);

  return (
    <LicenseGate>
    <div className="flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-950" style={{ height: '100dvh' }}>
      {/* ── Navbar ── */}
      <Navbar
        onExportPDF={handleExportPDF}
        onExportImage={handleExportImage}
        onPrint={handlePrint}
        isExporting={isExporting}
      />

      {/* ── Mobile tab bar (hidden on lg+) ── */}
      <div className="no-print lg:hidden flex-shrink-0 flex bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        {([['form', 'فرم', PenLine], ['preview', 'پیش‌نمایش', Eye]] as const).map(
          ([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 dark:text-blue-400 border-blue-500'
                  : 'text-gray-500 dark:text-slate-400 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        )}
      </div>

      {/* ── Main layout ── */}
      <main className="flex-1 flex min-h-0">
        {/* Form panel */}
        <aside
          className={`
            w-full lg:w-[460px] xl:w-[500px] flex-shrink-0
            overflow-y-auto scrollbar-thin
            bg-gray-50 dark:bg-slate-950
            ${activeTab === 'preview' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}
          `}
        >
          <div className="p-3 sm:p-4 space-y-2.5 flex-1">
            <InvoiceHeader />
            <PartiesCard />
            <InvoiceItems />
            <InvoiceTotals />
            <InvoiceNotes />
            <SignatureUpload />
          </div>

          {/* Payable amount stays in view while the form scrolls */}
          <FormSummaryBar onShowPreview={() => setActiveTab('preview')} />

          <footer className="py-3 px-4 text-center border-t border-gray-100 dark:border-slate-800">
            <p className="text-[11px] text-gray-400 dark:text-slate-600">
              طراحی شده با ❤️ توسط{' '}
              <a
                href="https://github.com/alirewa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                @alirewa
              </a>
            </p>
          </footer>
        </aside>

        {/* Divider */}
        <div className="hidden lg:block w-px flex-shrink-0 bg-gray-200 dark:bg-slate-800" />

        {/* Preview panel */}
        <section
          className={`
            flex-1 min-w-0 min-h-0 flex flex-col
            ${activeTab === 'form' ? 'hidden lg:flex' : 'flex'}
          `}
        >
          <InvoicePreview />
        </section>
      </main>

      {/* Overlays */}
      <InvoiceListPanel />
      <CustomizationPanel />
      <ResetModal />
    </div>
    </LicenseGate>
  );
}
