import { CalendarHeader } from '@/components/events/calendar/calendar-header';
import { CalendarToolbar } from '@/components/events/calendar/calendar-toolbar';
import { EventList } from '@/components/events/calendar/event-list';
import { MonthGrid } from '@/components/events/calendar/month-grid';
import { Container } from '@/components/ui/container';
import { siteConfig } from '@/config/site';
import {
  EVENT_CATEGORIES,
  occurrencesInRange,
  type EventCategory,
  type EventOccurrence,
} from '@/lib/events';
import {
  monthBounds,
  monthGrid,
  parseMonth,
  todayAtMasjid,
  type CalendarState,
} from '@/lib/events/calendar';
import { listEvents } from '@/lib/events/repository';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Events & Courses',
  description: `Calendar of events and weekly courses at ${siteConfig.name}, ${siteConfig.address.locality}.`,
  path: '/events',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const isCategory = (v: string | undefined): v is EventCategory => !!v && v in EVENT_CATEGORIES;

/** Group occurrences by date, preserving order. */
function groupByDate(occurrences: EventOccurrence[]) {
  const map = new Map<string, EventOccurrence[]>();
  for (const o of occurrences) map.set(o.date, [...(map.get(o.date) ?? []), o]);
  return map;
}

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const today = todayAtMasjid();
  const category = one(params.category);
  const state: CalendarState = {
    month: parseMonth(one(params.month), today),
    view: one(params.view) === 'list' ? 'list' : 'month',
    q: one(params.q)?.slice(0, 100) || undefined,
    category: isCategory(category) ? category : undefined,
  };

  const events = await listEvents({
    search: state.q,
    category: isCategory(state.category) ? state.category : undefined,
  });
  const weeks = monthGrid(state.month, today);
  const gridStart = weeks[0]![0]!.date;
  const gridEnd = weeks.at(-1)!.at(-1)!.date;
  const { start, end } = monthBounds(state.month);

  const gridByDate = groupByDate(occurrencesInRange(events, gridStart, gridEnd));
  const monthByDate = groupByDate(occurrencesInRange(events, start, end));

  return (
    // Pulled up under the transparent header.
    <div className="-mt-16 bg-primary-900 pt-[calc(4rem+3rem)] pb-28 text-white lg:-mt-[8.5rem] lg:pt-[calc(8.5rem+4rem)]">
      <Container>
        <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
          {siteConfig.name}
        </p>
        <h1 className="mt-3 text-title-3xl text-white sm:text-title-4xl">Events &amp; Courses</h1>

        <div className="mt-10">
          <CalendarToolbar state={state} />
        </div>
        <div className="mt-10">
          <CalendarHeader state={state} currentMonth={today.slice(0, 7)} />
        </div>

        <div className="mt-8">
          {state.view === 'month' ? (
            <>
              <div className="hidden md:block">
                <MonthGrid weeks={weeks} byDate={gridByDate} state={state} />
              </div>
              {/* A 7-column grid is unreadable on phones: show the same month as a list. */}
              <div className="md:hidden">
                <EventList byDate={monthByDate} today={today} />
              </div>
            </>
          ) : (
            <EventList byDate={monthByDate} today={today} />
          )}
        </div>
      </Container>
    </div>
  );
}
