import 'server-only';

/**
 * Sends events to the Meta dataset (`META_DATASET_ID`, the pixel in the masjid's Tag Manager
 * container) through the Conversions API, with `META_CONVERSIONS_API_TOKEN`.
 *
 * Only live payments on the production site are sent, always as live events (no Test Event
 * Code, so nothing lands only under Test events). Anything else (Stripe test mode, previews,
 * local) isn't sent at all, so test donations never reach the live data.
 */
const GRAPH_VERSION = 'v23.0';

export interface MetaServerEvent {
  event_name: 'InitiateCheckout' | 'AddPaymentInfo' | 'Purchase' | 'Subscribe' | 'DonationRenewal';
  event_id: string;
  /** Unix seconds. */
  event_time: number;
  action_source: 'website' | 'system_generated';
  event_source_url?: string;
  user_data: Record<string, string | string[]>;
  custom_data: Record<string, string | number>;
}

export type SendResult = { sent: true; eventsReceived: number } | { sent: false; reason: string };

/** True only for live payments on the production deployment. */
export const isRealEvent = (live: boolean) => live && process.env.VERCEL_ENV === 'production';

export async function sendMetaEvent(event: MetaServerEvent, live: boolean): Promise<SendResult> {
  const dataset = process.env.META_DATASET_ID;
  const token = process.env.META_CONVERSIONS_API_TOKEN;
  if (!dataset || !token) return { sent: false, reason: 'Conversions API not configured' };
  if (!isRealEvent(live)) return { sent: false, reason: 'not a live payment on production' };

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(dataset)}/events`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [event], access_token: token }),
      signal: AbortSignal.timeout(8000),
    },
  );
  const body = (await res.json().catch(() => ({}))) as {
    events_received?: number;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(`Meta: ${body.error?.message ?? res.status}`);
  return { sent: true, eventsReceived: body.events_received ?? 0 };
}

/** Sends and logs, never throws: tracking must not break a payment or a webhook. */
export async function sendMetaEventSafely(event: MetaServerEvent, live: boolean) {
  try {
    const result = await sendMetaEvent(event, live);
    if (!result.sent) console.info('[meta] not sent', event.event_name, result.reason);
    return result;
  } catch (error) {
    console.error(
      '[meta] could not send',
      event.event_name,
      event.event_id,
      error instanceof Error ? error.message : error,
    );
    return { sent: false, reason: 'error' } as const;
  }
}
