'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

const ease = [0.45, 0, 0.2, 1] as const; // --ease-smooth
/** After this long, a note that it's still working (slow connections). */
const SLOW_MS = 5000;

/**
 * The payment step's loading state, shown from the connection check until Stripe's payment
 * fields have drawn, so the step never looks frozen: "Loading payment options…" with a sky line
 * sweeping across, dots that breathe, and placeholder tabs and fields pulsing one after another.
 * The same everywhere it's used (`HumanCheck`, `PaymentForm`), so the phases read as one wait.
 * Reduced motion: everything stays still.
 */
export function PaymentLoading() {
  const still = useReducedMotion();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(t);
  }, []);

  const pulse = (i: number) =>
    still
      ? {}
      : {
          animate: { opacity: [0.5, 1, 0.5] },
          transition: { duration: 1.6, ease, repeat: Infinity, delay: i * 0.15 },
        };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease }}
      className="space-y-4"
    >
      <div className="relative h-0.5 overflow-hidden bg-white/10">
        {!still && (
          <motion.span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1/3 bg-secondary-400"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ duration: 1.4, ease, repeat: Infinity }}
          />
        )}
      </div>

      <p className="flex items-baseline font-label text-sm font-bold tracking-[0.12em] text-white uppercase">
        Loading payment options
        <span aria-hidden className="ml-0.5 inline-flex">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              {...(still
                ? {}
                : {
                    animate: { opacity: [0.2, 1, 0.2] },
                    transition: { duration: 1.2, ease, repeat: Infinity, delay: i * 0.2 },
                  })}
            >
              .
            </motion.span>
          ))}
        </span>
      </p>

      {/* Placeholder for Stripe's method tabs and card fields. */}
      <div aria-hidden className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="h-14 bg-white/10" {...pulse(i)} />
          ))}
        </div>
        {[3, 4].map((i) => (
          <motion.div key={i} className="h-12 bg-white/10" {...pulse(i)} />
        ))}
      </div>

      {slow && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="text-sm text-primary-200"
        >
          Still loading. This can take a few seconds on a slower connection.
        </motion.p>
      )}
    </motion.div>
  );
}
