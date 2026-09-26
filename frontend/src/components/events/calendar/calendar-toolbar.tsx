import Link from 'next/link';
import { EVENT_CATEGORIES } from '@/lib/events';
import { calendarHref, type CalendarState } from '@/lib/events/calendar';
import { cn } from '@/lib/utils/cn';

const field =
  'h-12 border-0 bg-transparent font-label text-sm font-bold tracking-[0.12em] text-primary-950 uppercase placeholder:text-neutral-400 focus:outline-none';

/**
 * Search + category filter (a plain GET form — works without JavaScript) and the
 * List / Month view toggle.
 */
export function CalendarToolbar({ state }: { state: CalendarState }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      <form
        action="/events"
        method="get"
        role="search"
        className="flex flex-1 flex-col bg-white sm:flex-row sm:items-center"
      >
        <input type="hidden" name="month" value={state.month} />
        {state.view !== 'month' && <input type="hidden" name="view" value={state.view} />}
        <label className="flex flex-1 items-center px-5">
          <span className="sr-only">Search for events</span>
          <input
            type="search"
            name="q"
            defaultValue={state.q}
            placeholder="Search for events"
            className={cn(field, 'w-full')}
          />
        </label>
        <label className="flex items-center border-t border-neutral-200 px-5 sm:border-t-0 sm:border-l">
          <span className="sr-only">Filter by category</span>
          <select name="category" defaultValue={state.category ?? ''} className={cn(field, 'pr-2')}>
            <option value="">All categories</option>
            {Object.entries(EVENT_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="btn-fill relative h-12 bg-secondary-500 px-6 font-label text-sm font-bold tracking-[0.12em] text-primary-950 uppercase [--btn-fill:var(--color-secondary-300)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-400"
        >
          Find events
        </button>
      </form>

      <nav aria-label="Calendar view" className="flex">
        {(['list', 'month'] as const).map((view) => {
          const active = state.view === view;
          return (
            <Link
              key={view}
              href={calendarHref({ ...state, view })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-12 flex-1 items-center justify-center px-6 font-label text-sm font-bold tracking-[0.12em] uppercase transition-colors duration-300 lg:flex-none',
                active
                  ? 'bg-primary-500 text-white'
                  : 'border border-white/20 text-white hover:border-white hover:bg-white/10',
              )}
            >
              {view === 'list' ? 'List view' : 'Month view'}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
