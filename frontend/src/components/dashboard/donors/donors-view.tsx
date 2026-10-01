'use client';

import { useMemo, useState } from 'react';
import { DownloadIcon, SearchIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  contactColumns,
  donationColumns,
  donorColumns,
  downloadCsv,
  giftAidColumns,
  isGiftAidClaimable,
  toCsv,
} from '@/lib/dashboard/csv';
import { summariseDonors, taxYear } from '@/lib/dashboard/queries';
import { SUBSCRIPTION_STATUS_LABELS } from '@/lib/dashboard/types';
import { todayAtMasjid } from '@/lib/events/calendar';
import { countryName, UK } from '@/lib/giving/countries';
import { addDaysIso } from '@/lib/events/schedule';
import { cn } from '@/lib/utils/cn';
import { useDashboardQuery } from '../dashboard-api-provider';
import { Badge, EmptyState, Field, gbp, Input, LoadingRows, Panel, shortDate, td, th } from '../ui';

interface Range {
  from?: string;
  to?: string;
}

/**
 * Donor list for a period plus the exports: donations, donors, opted-in contacts and the HMRC
 * Gift Aid schedule.
 */
export function DonorsView() {
  const today = todayAtMasjid();
  const presets: { label: string; range: Range }[] = [
    { label: `Tax year ${taxYear(today).label}`, range: taxYear(today) },
    { label: `Tax year ${taxYear(today, 1).label}`, range: taxYear(today, 1) },
    { label: 'Last 12 months', range: { from: addDaysIso(today, -364), to: today } },
    { label: 'All time', range: {} },
  ];
  const [range, setRange] = useState<Range>(presets[0]!.range);
  const [search, setSearch] = useState('');

  const { data: campaigns = [] } = useDashboardQuery((api) => api.campaigns.list(), []);
  const { data: donations, loading } = useDashboardQuery(
    (api) => api.donations.list({ ...range, status: 'succeeded' }),
    [range],
  );

  const donors = useMemo(() => summariseDonors(donations ?? []), [donations]);
  const shown = donors.filter((d) =>
    [d.name, d.organisation, d.email, d.phone, d.postcode, d.city]
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  // HMRC: individuals only, succeeded payments with a declaration.
  const giftAid = (donations ?? []).filter(isGiftAidClaimable);
  const contacts = donors.filter((d) => d.marketingConsent);
  const suffix = `${range.from ?? 'start'}_to_${range.to ?? today}`;

  const exports = [
    {
      title: 'All donations',
      description:
        'One row per successful payment: donor details, campaign, Gift Aid, consent and source.',
      count: donations?.length ?? 0,
      run: () =>
        downloadCsv(`donations_${suffix}.csv`, toCsv(donations ?? [], donationColumns(campaigns))),
    },
    {
      title: 'Donor list',
      description: 'One row per donor: contact details, gifts, total, regular giving and consent.',
      count: donors.length,
      run: () => downloadCsv(`donors_${suffix}.csv`, toCsv(donors, donorColumns)),
    },
    {
      title: 'Opted-in contacts',
      description:
        'Donors who agreed to email updates (their latest choice), for the mailing list.',
      count: contacts.length,
      run: () => downloadCsv(`contacts-opted-in_${suffix}.csv`, toCsv(contacts, contactColumns)),
    },
    {
      title: 'Gift Aid schedule',
      description:
        "Claimable donations (individuals only) in HMRC's schedule column order, ready to paste into the claim spreadsheet.",
      count: giftAid.length,
      run: () => downloadCsv(`gift-aid_${suffix}.csv`, toCsv(giftAid, giftAidColumns)),
    },
  ];

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-end gap-4 p-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Period">
            {presets.map((p) => {
              const active = p.range.from === range.from && p.range.to === range.to;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRange(p.range)}
                  className={cn(
                    'h-10 border px-4 font-label text-xs font-bold tracking-[0.08em] uppercase transition-colors',
                    active
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-neutral-300 bg-white text-primary-700 hover:border-primary-500',
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            <Field label="From">
              <Input
                type="date"
                value={range.from ?? ''}
                onChange={(e) => setRange({ ...range, from: e.target.value || undefined })}
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={range.to ?? ''}
                onChange={(e) => setRange({ ...range, to: e.target.value || undefined })}
              />
            </Field>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {exports.map((x) => (
          <section key={x.title} className="flex flex-col border border-neutral-200 bg-white p-5">
            <h2 className="font-heading text-title-lg tracking-heading text-primary-900 uppercase">
              {x.title}
            </h2>
            <p className="mt-2 flex-1 text-sm text-neutral-500">{x.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="font-ui text-sm text-neutral-600 tabular-nums">{x.count} rows</span>
              <Button
                size="sm"
                variant="outline"
                onClick={x.run}
                disabled={!donations || x.count === 0}
              >
                <DownloadIcon className="size-4" />
                Download CSV
              </Button>
            </div>
          </section>
        ))}
      </div>

      <Panel
        title={`${donors.length} donors`}
        actions={
          <label className="relative block w-full sm:w-72">
            <span className="sr-only">Search donors</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="search"
              placeholder="Name, organisation, email, phone"
              className="py-1.5 pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        }
      >
        {!donations && loading ? (
          <LoadingRows />
        ) : shown.length === 0 ? (
          <EmptyState>No donors in this period.</EmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[58rem]">
              <thead>
                <tr>
                  <th className={th}>Donor</th>
                  <th className={th}>Location</th>
                  <th className={th}>Gifts</th>
                  <th className={th}>Last gift</th>
                  <th className={th}>Status</th>
                  <th className={th}>First source</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((d) => (
                  <tr key={d.id} className="hover:bg-primary-50/50">
                    <td className={td}>
                      <span className="block font-bold text-primary-900">{d.name}</span>
                      {d.organisation && (
                        <span className="block text-xs text-neutral-600">{d.organisation}</span>
                      )}
                      <a
                        href={`mailto:${d.email}`}
                        className="text-xs text-secondary-700 hover:underline"
                      >
                        {d.email}
                      </a>
                    </td>
                    <td className={td}>
                      <span className="block">{d.city}</span>
                      <span className="block font-ui text-xs">
                        {d.country === UK ? d.postcode : countryName(d.country)}
                      </span>
                    </td>
                    <td className={`${td} font-ui tabular-nums`}>{d.donations}</td>
                    <td className={`${td} font-ui whitespace-nowrap tabular-nums`}>
                      {shortDate(d.lastGift)}
                    </td>
                    <td className={td}>
                      <span className="flex flex-wrap gap-1.5">
                        {d.recurringStatus && (
                          <Badge tone={d.recurringStatus === 'active' ? 'sky' : 'warning'}>
                            {d.recurringStatus === 'active'
                              ? 'Regular'
                              : `Regular · ${SUBSCRIPTION_STATUS_LABELS[d.recurringStatus]}`}
                          </Badge>
                        )}
                        {d.type === 'organisation' && <Badge>Corporate</Badge>}
                        {d.giftAid && <Badge tone="indigo">Gift Aid</Badge>}
                        {d.marketingConsent && <Badge tone="success">Opted in</Badge>}
                      </span>
                    </td>
                    <td className={`${td} text-xs`}>{d.firstSource}</td>
                    <td
                      className={`${td} text-right font-ui font-semibold text-primary-900 tabular-nums`}
                    >
                      {gbp(d.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
