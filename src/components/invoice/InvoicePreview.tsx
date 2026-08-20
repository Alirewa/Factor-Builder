'use client';

import { useInvoiceStore } from '@/store/invoiceStore';
import { ModernTemplate } from './templates/ModernTemplate';
import { FormalTemplate } from './templates/FormalTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { CorporateTemplate } from './templates/CorporateTemplate';
import { StoreTemplate } from './templates/StoreTemplate';
import { usePreviewScale } from '@/hooks/usePreviewScale';
import { PreviewToolbar } from './PreviewToolbar';
import { Eye } from 'lucide-react';

const A4_WIDTH_PX = 794;

export function InvoicePreview() {
  const { invoice, totals } = useInvoiceStore();
  const template = invoice.customization.template;
  const { containerRef, scale } = usePreviewScale();

  const renderTemplate = () => {
    switch (template) {
      case 'store':     return <StoreTemplate     invoice={invoice} totals={totals} />;
      case 'formal':    return <FormalTemplate    invoice={invoice} totals={totals} />;
      case 'corporate': return <CorporateTemplate invoice={invoice} totals={totals} />;
      case 'minimal':   return <MinimalTemplate   invoice={invoice} totals={totals} />;
      case 'modern':    return <ModernTemplate    invoice={invoice} totals={totals} />;
      default:          return <StoreTemplate     invoice={invoice} totals={totals} />;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="no-print flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60">
        <Eye className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-medium text-gray-500 dark:text-slate-400">پیش‌نمایش زنده</span>
        <div className="mr-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-600 dark:text-green-400 hidden sm:inline">بروزرسانی خودکار</span>
        </div>
      </div>

      {/* Template + colour switcher, right above the sheet */}
      <PreviewToolbar />

      {/* Preview scroll area — scrollbar matches the form panel */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto scrollbar-thin bg-slate-200 dark:bg-slate-900 p-4 md:p-6"
      >
        {/*
          Use CSS `zoom` instead of `transform: scale + negative-marginBottom`.
          zoom scales the element AND adjusts the layout space it occupies,
          so no manual margin compensation is needed — eliminating the
          feedback-loop that caused the preview to shake.
        */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            className="invoice-preview bg-white shadow-xl"
            style={{
              width: A4_WIDTH_PX,
              zoom: scale,
              flexShrink: 0,
            }}
          >
            {renderTemplate()}
          </div>
        </div>
      </div>
    </div>
  );
}
