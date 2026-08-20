'use client';

import { useState } from 'react';
import {
  Moon, Sun, Settings, Download,
  Printer, FolderOpen, Menu, X, FileText, ImageIcon, ChevronDown,
} from 'lucide-react';
import { useInvoiceStore } from '@/store/invoiceStore';
import { cn, toPersianDigits } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onExportPDF: () => void;
  onExportImage: () => void;
  onPrint: () => void;
  isExporting: boolean;
}

export function Navbar({ onExportPDF, onExportImage, onPrint, isExporting }: NavbarProps) {
  const { theme, setTheme, toggleCustomization, toggleInvoiceList, savedInvoices } = useInvoiceStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  const pickExport = (run: () => void) => {
    setExportOpen(false);
    run();
  };

  return (
    <>
      <header className="no-print flex-shrink-0 sticky top-0 z-50 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-700/80">
        <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/>
              </svg>
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">فاکتورساز اختصاصی</p>
            </div>
          </motion.div>

          {/* ── Desktop action buttons (sm+) ── */}
          <div className="hidden sm:flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={toggleInvoiceList}
              className="btn-ghost px-3 relative"
              title="فاکتورهای ذخیره‌شده"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-xs">فاکتورها</span>
              {savedInvoices.length > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-blue-500 text-[9px] text-white font-bold flex items-center justify-center">
                  {toPersianDigits(savedInvoices.length)}
                </span>
              )}
            </button>

            <button onClick={toggleCustomization} className="btn-ghost px-3" title="تنظیمات">
              <Settings className="w-4 h-4" />
              <span className="text-xs">تنظیمات</span>
            </button>

            <span className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-0.5" />

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-ghost px-2.5"
              title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button onClick={onPrint} className="btn-secondary px-3 text-xs" title="چاپ">
              <Printer className="w-4 h-4" />
              <span>چاپ</span>
            </button>

            {/* Download PDF, with JPEG behind the caret */}
            <div className="relative">
              <div className="flex items-stretch">
                <button
                  onClick={onExportPDF}
                  disabled={isExporting}
                  className={cn(
                    'btn-primary text-xs bg-blue-600 hover:bg-blue-700 px-3 rounded-l-none',
                    isExporting && 'opacity-70'
                  )}
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'در حال ساخت...' : 'دانلود PDF'}</span>
                </button>
                <button
                  onClick={() => setExportOpen((v) => !v)}
                  disabled={isExporting}
                  aria-label="فرمت‌های دیگر خروجی"
                  aria-expanded={exportOpen}
                  className={cn(
                    'btn-primary bg-blue-600 hover:bg-blue-700 px-1.5 rounded-r-none border-r border-blue-500/60',
                    isExporting && 'opacity-70'
                  )}
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', exportOpen && 'rotate-180')} />
                </button>
              </div>

              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 w-48 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
                    <ExportOption
                      icon={<FileText className="w-4 h-4" />}
                      label="فایل PDF"
                      hint="مناسب چاپ و ارسال رسمی"
                      onClick={() => pickExport(onExportPDF)}
                    />
                    <ExportOption
                      icon={<ImageIcon className="w-4 h-4" />}
                      label="تصویر JPEG"
                      hint="مناسب واتساپ و تلگرام"
                      onClick={() => pickExport(onExportImage)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Mobile: PDF + hamburger ── */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onExportPDF}
              disabled={isExporting}
              className={cn('btn-primary text-xs bg-blue-600 hover:bg-blue-700 px-3 py-2 gap-1.5', isExporting && 'opacity-70')}
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? '...' : 'PDF'}</span>
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="btn-ghost p-2"
              aria-label="منو"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] sm:hidden no-print"
              onClick={closeDrawer}
            />

            {/* Drawer panel — slides from right (RTL layout) */}
            <motion.div
              key="drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 z-[61] flex flex-col shadow-2xl sm:hidden no-print"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8v-2zm0-4h8v2H8v-2z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">فاکتورساز اختصاصی</p>
                  </div>
                </div>
                <button onClick={closeDrawer} className="btn-ghost p-1.5" aria-label="بستن منو">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer menu items */}
              <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                <DrawerItem
                  icon={<ImageIcon className="w-5 h-5" />}
                  label="دانلود تصویر JPEG"
                  onClick={() => { onExportImage(); closeDrawer(); }}
                />

                <DrawerItem
                  icon={<Printer className="w-5 h-5" />}
                  label="چاپ فاکتور"
                  onClick={() => { onPrint(); closeDrawer(); }}
                />

                <DrawerItem
                  icon={<FolderOpen className="w-5 h-5" />}
                  label="فاکتورهای ذخیره‌شده"
                  badge={savedInvoices.length > 0 ? savedInvoices.length : undefined}
                  onClick={() => { toggleInvoiceList(); closeDrawer(); }}
                />

                <DrawerItem
                  icon={<Settings className="w-5 h-5" />}
                  label="تنظیمات قالب"
                  onClick={() => { toggleCustomization(); closeDrawer(); }}
                />

                <div className="!my-3 border-t border-gray-100 dark:border-slate-800" />

                <DrawerItem
                  icon={theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  label={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
                  onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); closeDrawer(); }}
                />

              </nav>

              {/* Drawer footer */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800">
                <p className="text-[11px] text-center text-gray-400 dark:text-slate-600">
                  طراحی شده با ❤️ توسط{' '}
                  <a
                    href="https://github.com/alirewa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-500 transition-colors"
                  >
                    @alirewa
                  </a>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function ExportOption({
  icon, label, hint, onClick,
}: { icon: React.ReactNode; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-right hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors"
    >
      <span className="text-blue-500 dark:text-blue-400 flex-shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-gray-800 dark:text-slate-100">{label}</span>
        <span className="block text-[10px] text-gray-400 dark:text-slate-500">{hint}</span>
      </span>
    </button>
  );
}

/* ── Drawer menu item component ── */
interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  danger?: boolean;
  onClick: () => void;
}

function DrawerItem({ icon, label, badge, danger, onClick }: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors text-right',
        danger
          ? 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
      )}
    >
      <span className={cn(
        'flex-shrink-0',
        danger ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-slate-400'
      )}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="w-5 h-5 rounded-full bg-blue-500 text-[10px] text-white font-bold flex items-center justify-center">
          {toPersianDigits(badge)}
        </span>
      )}
    </button>
  );
}
