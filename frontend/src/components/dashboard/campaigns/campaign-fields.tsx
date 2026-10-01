import type { Campaign } from '@/lib/dashboard/types';
import type { DonationTracker } from '@/lib/donations/types';
import { checkoutHref } from '@/lib/dashboard/campaigns';
import { Badge, Field, Input, Panel, Select, Textarea } from '../ui';

const num = (value: string) => (value === '' ? Number.NaN : Number(value));

/** The campaign form's fields, grouped into panels. Errors are keyed by zod path ("cta.label"). */
export function CampaignFields({
  draft,
  errors,
  isNew,
  statuses,
  onChange,
}: {
  draft: Campaign;
  errors: Record<string, string>;
  isNew: boolean;
  statuses: readonly Campaign['status'][];
  onChange: (patch: Partial<Campaign>) => void;
}) {
  const tracker = draft.tracker;
  const setTracker = (patch: Partial<DonationTracker>) =>
    onChange({ tracker: { display: 'amount', current: 0, target: 1000, ...tracker, ...patch } });

  return (
    <div className="space-y-6">
      <Panel title="Details">
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Title" error={errors.title} className="sm:col-span-2">
            <Input value={draft.title} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>
          <Field
            label="Slug"
            hint={
              isNew
                ? 'Made from the title: lowercase letters, numbers and hyphens.'
                : "Can't be changed once created."
            }
            error={errors.id}
          >
            <Input
              value={draft.id}
              readOnly={!isNew}
              onChange={(e) => onChange({ id: e.target.value })}
              className="font-ui"
            />
          </Field>
          <Field label="Status" hint="Only active campaigns are public.">
            <Select
              value={draft.status}
              onChange={(e) => onChange({ status: e.target.value as Campaign['status'] })}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s[0]!.toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Summary"
            hint="One or two sentences."
            error={errors.summary}
            className="sm:col-span-2"
          >
            <Textarea
              value={draft.summary ?? ''}
              onChange={(e) => onChange({ summary: e.target.value || undefined })}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Giving">
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field
            label="Suggested amount (£)"
            hint="Leave empty for no amount."
            error={errors['price.amount']}
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              value={draft.price?.amount ?? ''}
              onChange={(e) =>
                onChange({
                  price: e.target.value
                    ? { period: draft.price?.period ?? 'once', amount: num(e.target.value) }
                    : undefined,
                })
              }
              className="font-ui"
            />
          </Field>
          <Field label="Frequency">
            <Select
              value={draft.price?.period ?? 'once'}
              disabled={!draft.price}
              onChange={(e) =>
                draft.price &&
                onChange({
                  price: { ...draft.price, period: e.target.value as 'once' | 'week' | 'month' },
                })
              }
            >
              <option value="once">One-off</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </Select>
          </Field>
          <Field label="Button label" error={errors['cta.label']}>
            <Input
              value={draft.cta.label}
              onChange={(e) => onChange({ cta: { ...draft.cta, label: e.target.value } })}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Payments"
        actions={
          draft.stripe ? (
            <Badge tone="success">Linked to Stripe</Badge>
          ) : (
            <Badge>Not linked yet</Badge>
          )
        }
      >
        <div className="space-y-3 p-5 text-sm text-neutral-600">
          <p>
            The donate button opens Stripe Checkout for this campaign. Supporters choose an amount,
            one-off or monthly, and can add Gift Aid. Every payment is recorded against this
            campaign under Donations.
          </p>
          <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
            <dt className="font-label text-xs font-bold tracking-[0.12em] text-neutral-400 uppercase">
              Donate link
            </dt>
            <dd className="font-ui break-all text-primary-900">
              {draft.id ? checkoutHref(draft.id) : '—'}
            </dd>
            <dt className="font-label text-xs font-bold tracking-[0.12em] text-neutral-400 uppercase">
              Stripe product
            </dt>
            <dd className="font-ui break-all text-primary-900">
              {draft.stripe?.productId ??
                'Created automatically when this campaign is saved, once payments are live.'}
            </dd>
          </dl>
        </div>
      </Panel>

      <Panel title="Progress tracker">
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Show as" className="sm:col-span-2">
            <Select
              value={tracker?.display ?? ''}
              onChange={(e) =>
                e.target.value
                  ? setTracker({ display: e.target.value as DonationTracker['display'] })
                  : onChange({ tracker: undefined })
              }
            >
              <option value="">No tracker</option>
              <option value="amount">Amount raised (£3,200 of £10,000)</option>
              <option value="percent">Percentage (32% funded)</option>
              <option value="donors">Donors (18 of 30 donors)</option>
            </Select>
          </Field>
          {tracker && (
            <>
              <Field
                label={tracker.display === 'donors' ? 'Donors so far' : 'Raised so far (£)'}
                error={errors['tracker.current']}
              >
                <Input
                  type="number"
                  min={0}
                  value={Number.isNaN(tracker.current) ? '' : tracker.current}
                  onChange={(e) => setTracker({ current: num(e.target.value) })}
                  className="font-ui"
                />
              </Field>
              <Field
                label={tracker.display === 'donors' ? 'Donor target' : 'Target (£)'}
                error={errors['tracker.target']}
              >
                <Input
                  type="number"
                  min={1}
                  value={Number.isNaN(tracker.target) ? '' : tracker.target}
                  onChange={(e) => setTracker({ target: num(e.target.value) })}
                  className="font-ui"
                />
              </Field>
              <Field
                label="Custom label (optional)"
                hint="Replaces the line under the bar."
                className="sm:col-span-2"
              >
                <Input
                  value={tracker.label ?? ''}
                  onChange={(e) => setTracker({ label: e.target.value || undefined })}
                />
              </Field>
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}
