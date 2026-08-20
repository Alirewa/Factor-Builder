'use client';

import { cn, toPersianDigits } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export type SectionBadgeTone = 'neutral' | 'done' | 'empty';

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  /** Small ordinal shown before the title, so the form reads as ordered steps. */
  step?: number;
  /** Short status pill on the right — e.g. "۴ کالا" or "تکمیل نشده". */
  badge?: string;
  badgeTone?: SectionBadgeTone;
  /** One-line hint under the title; only rendered while the section is open. */
  hint?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  headerAction?: React.ReactNode;
}

const BADGE_TONES: Record<SectionBadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-500 dark:bg-slate-700/60 dark:text-slate-300',
  done:    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400',
  empty:   'bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400',
};

export function SectionCard({
  title,
  icon,
  step,
  badge,
  badgeTone = 'neutral',
  hint,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
  headerAction,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const open = !collapsible || isOpen;

  // The body must clip while the height animates, otherwise a collapsed
  // section keeps painting its children outside the zero-height box. Once the
  // section is settled open it goes back to `visible` so date-picker popovers
  // and dropdowns can escape the card.
  const [clipping, setClipping] = useState(false);

  return (
    // NOTE: NO overflow-hidden here — dropdowns inside need to escape
    <div className={cn('card', className)}>
      <div
        className={cn(
          'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl transition-colors',
          collapsible && 'cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-slate-700/30'
        )}
        onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? isOpen : undefined}
      >
        {/* Step number keeps the long form readable as a sequence */}
        {step !== undefined && (
          <span className="flex-shrink-0 w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center tabular-nums">
            {toPersianDigits(step)}
          </span>
        )}

        {icon && <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">{icon}</span>}

        <h2 className="section-title truncate">{title}</h2>

        {badge && (
          <span
            className={cn(
              'flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-medium',
              BADGE_TONES[badgeTone]
            )}
          >
            {badge}
          </span>
        )}

        <div className="mr-auto flex items-center gap-1 flex-shrink-0">
          {headerAction}
          {collapsible && (
            <motion.span
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="text-gray-400 flex-shrink-0"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          )}
        </div>
      </div>

      {open && <div className="divider" />}

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            onAnimationStart={() => setClipping(true)}
            onAnimationComplete={() => setClipping(false)}
            style={{ overflow: clipping ? 'hidden' : 'visible' }}
          >
            <div className="p-3 sm:p-4">
              {hint && (
                <p className="text-[11px] text-gray-400 dark:text-slate-500 -mt-0.5 mb-3 leading-relaxed">
                  {hint}
                </p>
              )}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
