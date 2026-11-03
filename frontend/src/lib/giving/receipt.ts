import 'server-only';
import type Stripe from 'stripe';
import { siteConfig } from '@/config/site';
import { loadDonations } from '@/lib/donations/repository';
import { DEFAULT_FROM, sendEmail } from '@/lib/email/resend';
import { formatLongDate, nextPaymentDate } from './confirmation';
import { GIFT_AID, GIFT_AID_TEXT } from './consent';
import { referenceFromSession } from './payments';
import type { DailyPlan } from './schedule';
import { stripeFor } from './stripe-mode';
import { amountWithFrequency, formatGbp, type Frequency } from './types';

/**
 * The donor's receipt (marketing team, November 2026: Stripe sends none, and its receipts are an
 * account-wide setting shared with the masjid's other donation pages, so the website sends its
 * own). Sent from the Stripe webhook once the donation form's payment succeeds, like the
 * Purchase / Subscribe events: a one-off payment, the first weekly / monthly payment, or a daily
 * cause's / Jumu'ah giving's card saved. Direct Debit gets it once Stripe confirms the payment.
 * Later payments of a regular gift get no email. Gift Aid donors get the declaration they agreed
 * to, as the charity's written confirmation. Resend's idempotency key (the session or invoice id)
 * stops Stripe's retries sending it twice. Test-mode payments are marked "[Test]".
 */
type Meta = Record<string, string>;
const idOf = (v: string | { id: string } | null | undefined) => (typeof v === 'string' ? v : v?.id);

export interface Receipt {
  to: string;
  firstName: string;
  live: boolean;
  cause: string;
  reference: string;
  /** Per payment (daily causes: each night/day; Fitrana: the total). */
  amount: number;
  frequency: Frequency;
  people?: number;
  /** Daily causes and Jumu'ah giving: the payments scheduled. */
  plan?: DailyPlan;
  unit?: 'night' | 'day' | 'Friday';
  paidAt: Date;
  giftAid: boolean;
  giftAidDeclaredAt?: Date;
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The receipt's rows: [label, value]. */
export function receiptRows(r: Receipt): [string, string][] {
  const rows: [string, string][] = [['Cause', r.cause]];
  if (r.plan?.everyFriday) {
    rows.push(['Donation', `${formatGbp(r.plan.amount)} every Friday, until you cancel`]);
    rows.push(['First payment', formatLongDate(new Date(r.plan.firstCharge))]);
  } else if (r.plan) {
    const unit = r.unit === 'day' ? 'day' : 'night';
    rows.push([
      'Donation',
      `${formatGbp(r.plan.amount)} each ${unit} for ${r.plan.count} ${unit}s (${formatGbp(r.plan.amount * r.plan.count)} in total)`,
    ]);
    rows.push([
      'Payments',
      `${formatLongDate(new Date(r.plan.firstCharge))} to ${formatLongDate(new Date(r.plan.lastCharge))}`,
    ]);
  } else if (r.people && r.people > 1) {
    rows.push([
      'Donation',
      `${formatGbp(r.amount / r.people)} × ${r.people} people = ${formatGbp(r.amount)}`,
    ]);
  } else {
    rows.push([
      'Donation',
      r.frequency === 'one-off'
        ? `${formatGbp(r.amount)} (one-off)`
        : amountWithFrequency(r.amount, r.frequency),
    ]);
  }
  rows.push(['Reference', r.reference]);
  rows.push(['Date', formatLongDate(r.paidAt)]);
  const next = !r.plan && nextPaymentDate(r.frequency, r.paidAt);
  if (next) rows.push(['Next payment', formatLongDate(next)]);
  rows.push([
    'Gift Aid',
    !r.giftAid
      ? 'No'
      : regular(r)
        ? "Yes: we'll claim an extra 25% of each payment from HMRC"
        : `Yes: we'll claim an extra ${formatGbp(Math.round(r.amount * 25) / 100)} from HMRC`,
  ]);
  return rows;
}

const regular = (r: Receipt) => r.frequency !== 'one-off' || !!r.plan;

export function buildReceiptEmail(
  r: Receipt,
  env: Record<string, string | undefined> = process.env,
) {
  const contact = siteConfig.contact.email ?? '';
  const rows = receiptRows(r);
  const intro = `Jazakum Allahu khairan for your donation to ${r.cause}. This email confirms your gift; please keep it for your records.`;
  const change = regular(r)
    ? `To change or cancel your regular donation, reply to this email${contact ? ` or write to ${contact}` : ''}.`
    : '';
  const giftAid = r.giftAid
    ? {
        heading: 'Your Gift Aid declaration',
        text: `You declared${r.giftAidDeclaredAt ? ` on ${formatLongDate(r.giftAidDeclaredAt)}` : ''}: "${GIFT_AID_TEXT}"`,
        changes: GIFT_AID.changes,
      }
    : null;
  const address = `${siteConfig.legalName}, ${siteConfig.contact.addressLines.join(', ')}`;

  const text = [
    `Assalamu alaykum ${r.firstName},`,
    '',
    intro,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    ...(giftAid ? ['', giftAid.heading, giftAid.text, giftAid.changes] : []),
    ...(change ? ['', change] : []),
    '',
    `${siteConfig.name}`,
    address,
    siteConfig.url,
  ].join('\n');

  const cell = 'padding:8px 0;border-bottom:1px solid #e3e3ef;vertical-align:top;';
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f9;font-family:Arial,Helvetica,sans-serif;color:#1e1c4a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f9;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;">
<tr><td style="background:#363287;padding:24px 28px;color:#ffffff;font-size:20px;letter-spacing:0.04em;">${escape(siteConfig.name.toUpperCase())}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6;">
<p style="margin:0 0 12px;">Assalamu alaykum ${escape(r.firstName)},</p>
<p style="margin:0 0 20px;">${escape(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;">
${rows.map(([k, v]) => `<tr><td style="${cell}color:#515153;width:38%;">${escape(k)}</td><td style="${cell}font-weight:bold;">${escape(v)}</td></tr>`).join('\n')}
</table>
${giftAid ? `<h2 style="margin:28px 0 8px;font-size:16px;color:#363287;">${escape(giftAid.heading)}</h2><p style="margin:0 0 8px;">${escape(giftAid.text)}</p><p style="margin:0;color:#515153;font-size:14px;">${escape(giftAid.changes)}</p>` : ''}
${change ? `<p style="margin:24px 0 0;">${escape(change)}</p>` : ''}
</td></tr>
<tr><td style="padding:20px 28px;background:#f4f4f9;color:#515153;font-size:12px;line-height:1.5;">${escape(address)}<br><a href="${escape(siteConfig.url)}" style="color:#1d7fae;">${escape(siteConfig.url.replace(/^https?:\/\//, ''))}</a></td></tr>
</table></td></tr></table></body></html>`;

  return {
    from: env.CONTACT_EMAIL_FROM || DEFAULT_FROM,
    to: [r.to],
    reply_to: contact,
    subject: `${r.live ? '' : '[Test] '}Thank you for your donation to ${siteConfig.name}`,
    text,
    html,
  };
}

const frequencyOf = (m: Meta): Frequency =>
  (['one-off', 'weekly', 'monthly', 'daily'] as const).find((f) => f === m.frequency) ?? 'one-off';

function base(m: Meta, email: string | null | undefined, live: boolean, paidAt: Date) {
  const to = (email ?? m.donor_email ?? '').trim();
  if (!to || !m.campaign_id) return null;
  const giftAid = m.gift_aid === 'yes' && m.donor_type !== 'organisation';
  return {
    to,
    firstName: m.donor_first_name || 'friend',
    live,
    cause: m.campaign_title || m.campaign_id,
    paidAt,
    giftAid,
    ...(giftAid &&
      m.gift_aid_declared_at && { giftAidDeclaredAt: new Date(m.gift_aid_declared_at) }),
  };
}

/**
 * The receipt a webhook event calls for (with its idempotency key), or null. `plan`: the daily
 * schedule the webhook has just made sure exists.
 */
export async function receiptFor(
  event: Stripe.Event,
  plan?: DailyPlan | null,
): Promise<{ receipt: Receipt; key: string } | null> {
  const live = event.livemode;
  const paidAt = new Date(event.created * 1000);

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const s = event.data.object;
      const m = (s.metadata ?? {}) as Meta;
      const b = base(m, s.customer_details?.email ?? s.customer_email, live, paidAt);
      if (!b) return null;
      const reference = referenceFromSession(s.id);
      if (s.mode === 'setup' && (m.giving_kind === 'daily' || m.giving_kind === 'jumuah')) {
        if (event.type !== 'checkout.session.completed' || !plan) return null;
        const program = (await loadDonations()).programs.find((p) => p.id === m.campaign_id);
        const unit = plan.everyFriday
          ? 'Friday'
          : program?.giving.kind === 'daily'
            ? program.giving.unit
            : 'night';
        return {
          key: `receipt-${s.id}`,
          receipt: { ...b, reference, amount: plan.amount, frequency: 'daily', plan, unit },
        };
      }
      // One-off gifts; weekly/monthly ones get theirs with the first invoice.
      if (s.mode !== 'payment' || s.payment_status !== 'paid') return null;
      const people = Number(m.people) || undefined;
      return {
        key: `receipt-${s.id}`,
        receipt: {
          ...b,
          reference,
          amount: (s.amount_total ?? 0) / 100,
          frequency: 'one-off',
          ...(people && { people }),
        },
      };
    }

    case 'invoice.paid': {
      const inv = event.data.object;
      const details = inv.parent?.subscription_details;
      const m = (details?.metadata ?? {}) as Meta;
      const subscription = idOf(details?.subscription);
      if (
        !subscription ||
        !inv.id ||
        !inv.amount_paid ||
        inv.billing_reason !== 'subscription_create' ||
        m.giving_kind === 'daily' ||
        m.giving_kind === 'jumuah'
      )
        return null;
      const b = base(m, inv.customer_email, live, paidAt);
      if (!b) return null;
      // The checkout session that started it gives the reference shown on the thank-you step.
      const sessions = await stripeFor(live ? 'live' : 'test').checkout.sessions.list({
        subscription,
        limit: 1,
      });
      const session = sessions.data[0]?.id;
      return {
        key: `receipt-${inv.id}`,
        receipt: {
          ...b,
          reference: session ? referenceFromSession(session) : inv.id,
          amount: inv.amount_paid / 100,
          frequency: frequencyOf(m),
        },
      };
    }

    default:
      return null;
  }
}

/** Sends the receipt for a webhook event, if it calls for one. Logs, never throws. */
export async function sendReceiptSafely(event: Stripe.Event, plan?: DailyPlan | null) {
  try {
    const found = await receiptFor(event, plan);
    if (!found) return;
    const sent = await sendEmail(buildReceiptEmail(found.receipt), found.key);
    if ('error' in sent) console.error('[giving] receipt not sent', found.key, sent.error);
  } catch (error) {
    console.error(
      '[giving] could not send receipt',
      event.type,
      error instanceof Error ? error.message : error,
    );
  }
}
