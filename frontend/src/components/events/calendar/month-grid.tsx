import Link from 'next/link';
import { formatTime, getEventHref, type EventOccurrence } from '@/lib/events';
import { calendarHref, type CalendarDay, type CalendarState } from '@/lib/events/calendar';
import { cn } from '@/lib/utils/cn';

/** Events listed per day before collapsing into "+N more". */
const MAX_PER_DAY = 3;
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const fullDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** Month grid (Mon–Sun). Server-rendered; every event is a real link. */
export function MonthGrid({
  weeks,
  byDate,
  state,
}: {
  weeks: CalendarDay[][];
  byDate: Map<string, EventOccurrence[]>;
  state: CalendarState;
}) {
  return (
    <div role="grid" aria-label="Events calendar" className="border-t border-l border-white/10">
      <div role="row" className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            role="columnheader"
            className="border-r border-b border-white/10 px-4 py-3 font-label text-xs font-bold tracking-[0.2em] text-primary-200 uppercase"
          >
            {label}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0]!.date} role="row" className="grid grid-cols-7">
          {week.map((day) => {
            const items = byDate.get(day.date) ?? [];
            const extra = items.length - MAX_PER_DAY;
            return (
              <div
                key={day.date}
                role="gridcell"
                aria-label={`${fullDate.format(new Date(`${day.date}T12:00:00Z`))}, ${items.length} event${items.length === 1 ? '' : 's'}`}
                className={cn(
                  'flex min-h-40 flex-col border-r border-b border-white/10 p-3 xl:p-4',
                  !day.inMonth && 'bg-primary-950/40',
                  day.isToday && 'bg-secondary-500/10',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-9 items-center justify-center font-ui text-lg font-semibold',
                    day.isToday
                      ? 'bg-secondary-500 text-primary-950'
                      : day.inMonth
                        ? 'text-white'
                        : 'text-primary-300/50',
                  )}
                >
                  {day.day}
                </span>
                <ul className="mt-2 space-y-3">
                  {items.slice(0, MAX_PER_DAY).map(({ event }) => {
                    const time = formatTime(event.schedule);
                    return (
                      <li key={event.id}>
                        {time && <p className="font-ui text-xs text-secondary-300">{time}</p>}
                        <Link
                          href={getEventHref(event)}
                          className="block text-sm leading-snug text-white transition-colors duration-300 hover:text-secondary-300"
                        >
                          {event.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {extra > 0 && (
                  <Link
                    href={calendarHref({ ...state, view: 'list' }, `d-${day.date}`)}
                    className="mt-auto border-t border-white/10 pt-2 font-label text-xs font-bold tracking-[0.12em] text-primary-200 uppercase hover:text-white"
                  >
                    + {extra} more
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
