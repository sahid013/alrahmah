import type { KeyboardEvent } from 'react';
import { sourceOf } from '@/lib/dashboard/queries';
import type { Campaign, Donation } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils/cn';
import { Badge, gbp, shortDate, td, th } from '../ui';

/**
 * Donations table shared by the overview and the donations screen. With `onSelect`, rows open
 * the donation's details (click, or Enter on the focused row).
 */
export function DonationTable({
  donations,
  campaigns,
  compact = false,
  onSelect,
}: {
  donations: Donation[];
  campaigns: Campaign[];
  compact?: boolean;
  onSelect?: (donation: Donation) => void;
}) {
  const title = new Map(campaigns.map((c) => [c.id, c.title]));
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[44rem]">
        <thead>
          <tr>
            <th className={th}>Date</th>
            <th className={th}>Donor</th>
            <th className={th}>Campaign</th>
            <th className={th}>Type</th>
            {!compact && <th className={th}>Gift Aid</th>}
            {!compact && <th className={th}>Source</th>}
            <th className={`${th} text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((d) => (
            <tr
              key={d.id}
              className={cn('hover:bg-primary-50/50', onSelect && 'cursor-pointer')}
              {...(onSelect && {
                tabIndex: 0,
                'aria-label': `Donation from ${d.donor.firstName} ${d.donor.lastName}, show details`,
                onClick: () => onSelect(d),
                onKeyDown: (e: KeyboardEvent) => e.key === 'Enter' && onSelect(d),
              })}
            >
              <td className={`${td} font-ui whitespace-nowrap tabular-nums`}>
                {shortDate(d.createdAt)}
              </td>
              <td className={td}>
                <span className="block font-bold text-primary-900">
                  {d.donor.firstName} {d.donor.lastName}
                </span>
                {!compact && (
                  <span className="block text-xs">
                    {d.donor.organisation ? `${d.donor.organisation} · ` : ''}
                    {d.donor.email}
                  </span>
                )}
              </td>
              <td className={td}>{title.get(d.campaignId) ?? d.campaignId}</td>
              <td className={td}>
                {d.type === 'recurring' ? (
                  <Badge tone="sky">{d.frequency ?? 'Recurring'}</Badge>
                ) : (
                  <Badge>One-off</Badge>
                )}
              </td>
              {!compact && (
                <td className={td}>{d.giftAid ? <Badge tone="indigo">Gift Aid</Badge> : '—'}</td>
              )}
              {!compact && <td className={`${td} text-xs`}>{sourceOf(d)}</td>}
              <td className={`${td} text-right font-ui whitespace-nowrap tabular-nums`}>
                {d.status === 'refunded' ? (
                  <span className="text-error-700">
                    <span className="line-through">{gbp(d.amount)}</span> refunded
                  </span>
                ) : (
                  <span className="font-semibold text-primary-900">{gbp(d.amount)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
