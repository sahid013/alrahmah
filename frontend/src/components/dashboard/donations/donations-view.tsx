'use client';

import { useMemo, useState } from 'react';
import { ChevronIcon, DownloadIcon, SearchIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { donationColumns, downloadCsv, toCsv } from '@/lib/dashboard/csv';
import { donationTotals } from '@/lib/dashboard/queries';
import type { DonationQuery } from '@/lib/dashboard/types';
import { useDashboardQuery } from '../dashboard-api-provider';
import {
  EmptyState,
  Field,
  gbp,
  iconButton,
  Input,
  LoadingRows,
  Panel,
  Select,
  StatCard,
} from '../ui';
import { DonationTable } from './donation-rows';

const PAGE_SIZE = 25;

/** Filterable list of successful (and refunded) donations with CSV export. */
export function DonationsView() {
  const [query, setQuery] = useState<DonationQuery>({});
  const [page, setPage] = useState(0);
  const update = (patch: Partial<DonationQuery>) => {
    setQuery((q) => ({ ...q, ...patch }));
    setPage(0);
  };

  const { data: campaigns = [] } = useDashboardQuery((api) => api.campaigns.list(), []);
  const { data: donations, loading } = useDashboardQuery(
    (api) => api.donations.list(query),
    [query],
  );

  const totals = useMemo(() => donationTotals(donations ?? []), [donations]);
  const pages = Math.max(1, Math.ceil((donations?.length ?? 0) / PAGE_SIZE));
  const rows = donations?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];

  const exportCsv = () =>
    donations &&
    downloadCsv(
      `donations-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(donations, donationColumns(campaigns)),
    );

  return (
    <div className="space-y-6">
      <Panel>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Search" className="sm:col-span-2 lg:col-span-5">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                type="search"
                placeholder="Name, email or payment ref"
                className="pl-9"
                value={query.search ?? ''}
                onChange={(e) => update({ search: e.target.value || undefined })}
              />
            </div>
          </Field>
          <Field label="Campaign">
            <Select
              value={query.campaignId ?? ''}
              onChange={(e) => update({ campaignId: e.target.value || undefined })}
            >
              <option value="">All campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select
              value={query.type ?? ''}
              onChange={(e) =>
                update({ type: (e.target.value || undefined) as DonationQuery['type'] })
              }
            >
              <option value="">All types</option>
              <option value="one-off">One-off</option>
              <option value="recurring">Recurring</option>
            </Select>
          </Field>
          <Field label="Gift Aid">
            <Select
              value={query.giftAid === undefined ? '' : String(query.giftAid)}
              onChange={(e) =>
                update({ giftAid: e.target.value === '' ? undefined : e.target.value === 'true' })
              }
            >
              <option value="">Any</option>
              <option value="true">Gift Aid declared</option>
              <option value="false">No Gift Aid</option>
            </Select>
          </Field>
          <Field label="From">
            <Input
              type="date"
              value={query.from ?? ''}
              max={query.to}
              onChange={(e) => update({ from: e.target.value || undefined })}
            />
          </Field>
          <Field label="To">
            <Input
              type="date"
              value={query.to ?? ''}
              min={query.from}
              onChange={(e) => update({ to: e.target.value || undefined })}
            />
          </Field>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total received" value={gbp(totals.total)} hint="Excludes refunds" />
        <StatCard label="Donations" value={String(totals.count)} />
        <StatCard label="Recurring" value={gbp(totals.recurring)} />
        <StatCard
          label="Gift Aid value"
          value={gbp(totals.giftAidValue)}
          hint="25% of eligible gifts"
        />
      </div>

      <Panel
        title={donations ? `${donations.length} donations` : 'Donations'}
        actions={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!donations?.length}>
            <DownloadIcon className="size-4" />
            Export CSV
          </Button>
        }
      >
        {!donations && loading ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState>No donations match these filters.</EmptyState>
        ) : (
          <>
            <DonationTable donations={rows} campaigns={campaigns} />
            <div className="flex items-center justify-end gap-3 px-5 py-3 text-sm text-neutral-500">
              <span className="font-ui tabular-nums">
                Page {page + 1} of {pages}
              </span>
              <button
                type="button"
                className={iconButton}
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronIcon direction="left" className="size-4" />
              </button>
              <button
                type="button"
                className={iconButton}
                aria-label="Next page"
                disabled={page >= pages - 1}
                onClick={() => setPage(page + 1)}
              >
                <ChevronIcon direction="right" className="size-4" />
              </button>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
