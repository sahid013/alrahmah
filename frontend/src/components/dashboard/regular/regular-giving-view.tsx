'use client';

import { useMemo, useState } from 'react';
import { DownloadIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { downloadCsv, regularGiftColumns, toCsv } from '@/lib/dashboard/csv';
import { monthlyValue, summariseRegularGifts } from '@/lib/dashboard/queries';
import {
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUSES,
  type SubscriptionStatus,
} from '@/lib/dashboard/types';
import { cn } from '@/lib/utils/cn';
import { useDashboardQuery } from '../dashboard-api-provider';
import { Badge, EmptyState, gbp, LoadingRows, Panel, shortDate, StatCard, td, th } from '../ui';

const STATUS_TONE = { active: 'success', past_due: 'warning', cancelled: 'neutral' } as const;

/** Weekly and monthly gifts (Stripe subscriptions): status, value and history. */
export function RegularGivingView() {
  const [status, setStatus] = useState<SubscriptionStatus | 'all'>('all');
  const { data } = useDashboardQuery(
    async (api) => ({
      campaigns: await api.campaigns.list(),
      donations: await api.donations.list({ type: 'recurring' }),
    }),
    [],
  );

  const gifts = useMemo(() => summariseRegularGifts(data?.donations ?? []), [data]);
  if (!data) return <LoadingRows />;

  const title = new Map(data.campaigns.map((c) => [c.id, c.title]));
  const active = gifts.filter((g) => g.status === 'active');
  const shown = status === 'all' ? gifts : gifts.filter((g) => g.status === status);
  const count = (s: SubscriptionStatus) => gifts.filter((g) => g.status === s).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active regular gifts" value={String(active.length)} />
        <StatCard
          label="Monthly income"
          value={gbp(
            active.reduce((n, g) => n + monthlyValue(g), 0),
            0,
          )}
          hint="Active gifts, weekly converted to monthly"
        />
        <StatCard
          label="Payment failed"
          value={String(count('past_due'))}
          hint="Stripe is retrying; worth a friendly email"
        />
        <StatCard label="Cancelled" value={String(count('cancelled'))} />
      </div>

      <Panel
        title={`${shown.length} regular gifts`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status">
              {(['all', ...SUBSCRIPTION_STATUSES] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'h-9 border px-3 font-label text-xs font-bold tracking-[0.08em] uppercase transition-colors',
                    status === s
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-neutral-300 bg-white text-primary-700 hover:border-primary-500',
                  )}
                >
                  {s === 'all' ? 'All' : SUBSCRIPTION_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!shown.length}
              onClick={() =>
                downloadCsv(
                  `regular-giving-${new Date().toISOString().slice(0, 10)}.csv`,
                  toCsv(shown, regularGiftColumns(data.campaigns)),
                )
              }
            >
              <DownloadIcon className="size-4" />
              Export CSV
            </Button>
          </div>
        }
      >
        {shown.length === 0 ? (
          <EmptyState>No regular gifts with this status.</EmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[56rem]">
              <thead>
                <tr>
                  <th className={th}>Donor</th>
                  <th className={th}>Campaign</th>
                  <th className={th}>Gift</th>
                  <th className={th}>Status</th>
                  <th className={th}>Started</th>
                  <th className={th}>Last payment</th>
                  <th className={`${th} text-right`}>Total given</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((g) => (
                  <tr key={g.id} className="hover:bg-primary-50/50">
                    <td className={td}>
                      <span className="block font-bold text-primary-900">{g.donorName}</span>
                      {g.organisation && (
                        <span className="block text-xs text-neutral-600">{g.organisation}</span>
                      )}
                      <a
                        href={`mailto:${g.email}`}
                        className="text-xs text-secondary-700 hover:underline"
                      >
                        {g.email}
                      </a>
                    </td>
                    <td className={td}>{title.get(g.campaignId) ?? g.campaignId}</td>
                    <td className={`${td} font-ui whitespace-nowrap`}>
                      {gbp(g.amount)} / {g.frequency === 'weekly' ? 'week' : 'month'}
                      {g.giftAid && (
                        <span className="ml-2">
                          <Badge tone="indigo">Gift Aid</Badge>
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      <Badge tone={STATUS_TONE[g.status]}>
                        {SUBSCRIPTION_STATUS_LABELS[g.status]}
                      </Badge>
                    </td>
                    <td className={`${td} font-ui whitespace-nowrap`}>{shortDate(g.startedAt)}</td>
                    <td className={`${td} font-ui whitespace-nowrap`}>
                      {shortDate(g.lastPaymentAt)}
                    </td>
                    <td className={`${td} text-right font-ui whitespace-nowrap`}>
                      <span className="font-semibold text-primary-900">{gbp(g.total)}</span>
                      <span className="block text-xs">
                        {g.payments} {g.payments === 1 ? 'payment' : 'payments'}
                      </span>
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
