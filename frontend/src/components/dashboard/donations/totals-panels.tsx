import { sourceOf, totalsBy } from '@/lib/dashboard/queries';
import type { Campaign, Donation } from '@/lib/dashboard/types';
import { gbp, Panel } from '../ui';

function TotalsList({
  rows,
  label,
}: {
  rows: { key: string; total: number; count: number }[];
  label: (key: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  if (!rows.length) return <p className="px-5 py-6 text-sm text-neutral-500">No donations.</p>;
  return (
    <ul className="space-y-4 p-5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="font-bold text-primary-900">{label(r.key)}</span>
            <span className="font-ui text-neutral-600 tabular-nums">
              {gbp(r.total, 0)} <span className="text-neutral-400">· {r.count}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 bg-neutral-100">
            <div
              className="h-full bg-secondary-500"
              style={{ width: `${(r.total / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Basic reporting for the filtered donations: totals per campaign and per source. */
export function TotalsPanels({
  donations,
  campaigns,
}: {
  donations: Donation[];
  campaigns: Campaign[];
}) {
  const title = new Map(campaigns.map((c) => [c.id, c.title]));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="By campaign">
        <TotalsList
          rows={totalsBy(donations, (d) => d.campaignId)}
          label={(k) => title.get(k) ?? k}
        />
      </Panel>
      <Panel title="By source">
        <TotalsList
          rows={totalsBy(donations, sourceOf)}
          label={(k) => (k === 'direct' ? 'Direct / no tracking' : k)}
        />
      </Panel>
    </div>
  );
}
