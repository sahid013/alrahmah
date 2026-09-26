import Link from 'next/link';
import { ChevronIcon } from '@/components/icons';
import { calendarHref, formatMonth, shiftMonth, type CalendarState } from '@/lib/events/calendar';
import { cn } from '@/lib/utils/cn';

const square =
  'inline-flex size-10 items-center justify-center border border-white/20 text-white transition-colors duration-300 hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-400';

/** Month navigation: previous / next (real links), "This month", and the month title. */
export function CalendarHeader({
  state,
  currentMonth,
}: {
  state: CalendarState;
  currentMonth: string;
}) {
  const isCurrent = state.month === currentMonth;
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      <Link
        href={calendarHref({ ...state, month: shiftMonth(state.month, -1) })}
        aria-label="Previous month"
        className={square}
      >
        <ChevronIcon direction="left" className="size-4" />
      </Link>
      <Link
        href={calendarHref({ ...state, month: shiftMonth(state.month, 1) })}
        aria-label="Next month"
        className={square}
      >
        <ChevronIcon direction="right" className="size-4" />
      </Link>
      <Link
        href={calendarHref({ ...state, month: currentMonth })}
        aria-current={isCurrent ? 'date' : undefined}
        className={cn(
          'inline-flex h-10 items-center border px-4 font-label text-xs font-bold tracking-[0.15em] uppercase transition-colors duration-300',
          isCurrent
            ? 'border-secondary-400 text-secondary-300'
            : 'border-white/20 text-white hover:border-white hover:bg-white/10',
        )}
      >
        This month
      </Link>
      <h2 className="ml-1 font-heading text-title-2xl leading-none tracking-heading text-white uppercase sm:text-title-3xl">
        {formatMonth(state.month)}
      </h2>
    </div>
  );
}
