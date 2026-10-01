'use client';

import { motion } from 'motion/react';

export const STEPS = ['Amount', 'Details', 'Payment', 'Thank you'] as const;

const spring = { type: 'spring', stiffness: 260, damping: 32 } as const;

/**
 * Progress line with square markers (dark theme). The sky line fills between markers and the
 * active outline glides to the current step (framer-motion; reduced motion via MotionConfig).
 * Only the current step's label shows.
 * Completed steps are buttons for going back.
 */
export function Stepper({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (step: number) => void;
}) {
  const last = STEPS.length - 1;

  return (
    <div className="relative">
      {/* Track between the first and last marker centres (columns are equal width). */}
      <div
        aria-hidden
        className="absolute top-2.5 h-px bg-white/15"
        style={{ left: `${50 / STEPS.length}%`, right: `${50 / STEPS.length}%` }}
      >
        <motion.div
          className="h-full origin-left bg-secondary-400"
          initial={false}
          animate={{ scaleX: current / last }}
          transition={spring}
        />
      </div>

      <ol className="relative grid grid-cols-4" aria-label="Donation steps">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const canGoBack = done && current < last;
          const marker = (
            <>
              <span className="relative mx-auto flex size-5 items-center justify-center">
                <motion.span
                  aria-hidden
                  initial={false}
                  animate={{
                    backgroundColor: done || active ? '#25a6de' : '#161436',
                    borderColor: done || active ? '#25a6de' : 'rgba(255,255,255,0.3)',
                    scale: active ? 1 : 0.7,
                  }}
                  transition={spring}
                  className="size-3.5 border-2"
                />
                {active && (
                  <motion.span
                    aria-hidden
                    layoutId="active-step"
                    transition={spring}
                    className="absolute inset-0 border-2 border-secondary-400"
                  />
                )}
              </span>
              {/* Only the active step's label is visible; the others stay in the accessibility
                  tree (opacity only) and keep their space so nothing shifts. */}
              <motion.span
                initial={false}
                animate={{ opacity: active ? 1 : 0, y: active ? 0 : -4 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mt-3 block font-label text-[0.65rem] font-bold tracking-[0.15em] text-white uppercase sm:text-xs"
              >
                {label}
              </motion.span>
            </>
          );
          return (
            <li key={label} className="text-center" aria-current={active ? 'step' : undefined}>
              {canGoBack ? (
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className="block w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-400"
                  aria-label={`Back to ${label}`}
                >
                  {marker}
                </button>
              ) : (
                <div>{marker}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
