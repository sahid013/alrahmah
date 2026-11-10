'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { RepeatIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { formatGbp } from '@/lib/giving/types';

const ease = [0.45, 0, 0.2, 1] as const; // --ease-smooth

/**
 * "Could you make it monthly?" under a one-off amount (marketing team, November 2026: the first
 * week's ad donations were all one-off). Suggests the same amount, monthly (client, November
 * 2026). One tap switches the form to Monthly at that amount; "Keep it one-off" hides it for this
 * visit to the step.
 */
export function MonthlyNudge({
  show,
  monthlyAmount,
  cause,
  onAccept,
}: {
  /** One-off with a valid amount. */
  show: boolean;
  monthlyAmount: number;
  cause: string;
  onAccept: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const visible = show && !dismissed && Number.isFinite(monthlyAmount) && monthlyAmount > 0;

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.aside
          key="nudge"
          aria-label="Make it monthly"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease }}
          className="overflow-hidden"
        >
          <div className="space-y-4 border-l-2 border-secondary-400 bg-white/5 px-5 py-4">
            <p className="text-primary-100">
              <strong className="text-white">Could you make it monthly?</strong>{' '}
              <span className="font-ui">{formatGbp(monthlyAmount)}</span> a month gives{' '}
              <span className="font-ui">{formatGbp(monthlyAmount * 12)}</span> a year to {cause},
              steady support the masjid can plan around. Cancel any time.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Button type="button" size="sm" variant="outline-light" onClick={onAccept}>
                <RepeatIcon className="size-4" />
                Give {formatGbp(monthlyAmount)} monthly
              </Button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="font-label text-xs font-bold tracking-[0.12em] text-primary-200 uppercase transition-colors hover:text-white"
              >
                Keep it one-off
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
