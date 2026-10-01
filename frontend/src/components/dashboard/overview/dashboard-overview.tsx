'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import { calculatedDay } from '@/lib/dashboard/prayer';
import { donationTotals, summariseDonors } from '@/lib/dashboard/queries';
import { hasJamaah, PRAYER_LABELS, PRAYERS } from '@/lib/dashboard/types';
import { todayAtMasjid } from '@/lib/events/calendar';
import { addDaysIso } from '@/lib/events/schedule';
import { useDashboardQuery } from '../dashboard-api-provider';
import { DonationTable } from '../donations/donation-rows';
import { gbp, LoadingRows, Panel, StatCard } from '../ui';

const PERIOD_DAYS = 30;

const ViewAll = ({ href, children }: { href: string; children: string }) => (
  <Link
    href={href}
    className="inline-flex items-center gap-1.5 font-label text-xs font-bold tracking-[0.12em] text-primary-500 uppercase hover:text-secondary-700"
  >
    {children}
    <ArrowRightIcon className="size-3.5" />
  </Link>
);

export function DashboardOverview() {
  const today = todayAtMasjid();
  const from = addDaysIso(today, -(PERIOD_DAYS - 1));

  const { data } = useDashboardQuery(
    async (api) => {
      const [donations, campaigns, overrides] = await Promise.all([
        api.donations.list({ from, to: today }),
        api.campaigns.list(),
        api.prayer.listDays(today, today),
      ]);
      return { donations, campaigns, prayer: overrides[0] };
    },
    [from, today],
  );

  if (!data) return <LoadingRows />;

  const totals = donationTotals(data.donations);
  const donors = summariseDonors(data.donations);
  const prayer = data.prayer ?? calculatedDay(today);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Raised · ${PERIOD_DAYS} days`}
          value={gbp(totals.total, 0)}
          hint={`${totals.count} donations`}
        />
        <StatCard
          label="Donors"
          value={String(donors.length)}
          hint={`${donors.filter((d) => d.recurring).length} giving regularly`}
        />
        <StatCard
          label="Recurring income"
          value={gbp(totals.recurring, 0)}
          hint="From regular gifts in this period"
        />
        <StatCard
          label="Gift Aid to claim"
          value={gbp(totals.giftAidValue, 0)}
          hint={`On ${gbp(totals.giftAidEligible, 0)} of eligible gifts`}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel
          className="xl:self-start"
          title="Latest donations"
          actions={<ViewAll href="/dashboard/donations">All donations</ViewAll>}
        >
          <DonationTable
            donations={data.donations.slice(0, 8)}
            campaigns={data.campaigns}
            compact
          />
        </Panel>

        <div className="space-y-6">
          <Panel title="Today's prayer times">
            <dl className="divide-y divide-neutral-100 px-5 py-2">
              {PRAYERS.map((p) => {
                const t = prayer.times[p] as { adhan: string; jamaah?: string };
                return (
                  <div key={p} className="flex items-center justify-between py-2">
                    <dt className="font-heading text-base tracking-heading text-primary-900 uppercase">
                      {PRAYER_LABELS[p]}
                    </dt>
                    <dd className="font-ui text-sm text-neutral-600 tabular-nums">
                      {t.adhan}
                      {hasJamaah(p) && t.jamaah && (
                        <span className="ml-2 text-secondary-700">Jama&apos;ah {t.jamaah}</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <div className="border-t border-neutral-200 px-5 py-3">
              <ViewAll href="/dashboard/prayer-times">Edit timetable</ViewAll>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
