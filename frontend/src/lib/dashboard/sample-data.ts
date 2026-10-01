import { seedDonations } from '@/lib/donations/data';
import type { Campaign, Donation } from './types';

/**
 * SAMPLE data for the dashboard preview only — fictional donors (example.com emails), generated
 * deterministically so every reload looks the same. Replaced by real Stripe-recorded donations
 * once the backend is connected.
 */

/** Campaigns start from the public donation programmes. */
export const sampleCampaigns = (): Campaign[] =>
  seedDonations.programs.map((p, i) => ({ ...p, status: 'active', order: i }));

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Aisha',
  'Yusuf',
  'Fatima',
  'Ibrahim',
  'Maryam',
  'Omar',
  'Zainab',
  'Bilal',
  'Khadija',
  'Hamza',
  'Sumayyah',
  'Idris',
  'Ruqayyah',
  'Zakariya',
  'Hafsa',
  'Ismail',
  'Safiya',
  'Musa',
  'Amina',
  'Harun',
];
const LAST = [
  'Khan',
  'Ahmed',
  'Hussain',
  'Ali',
  'Patel',
  'Rahman',
  'Begum',
  'Iqbal',
  'Malik',
  'Shah',
  'Akhtar',
  'Mahmood',
  'Siddiqui',
  'Qureshi',
];
const STREETS = [
  'Sheepscar Way',
  'Chapeltown Road',
  'Harehills Lane',
  'Roundhay Road',
  'Spencer Place',
  'Francis Street',
  'Leopold Street',
  'Hyde Park Road',
  'Beeston Road',
  'Dewsbury Road',
];
const POSTCODES = [
  'LS7 3JB',
  'LS8 4AB',
  'LS6 2DT',
  'LS9 7HJ',
  'LS11 5QW',
  'LS17 6EE',
  'BD3 9LP',
  'LS28 7TR',
];
const ABROAD = [
  { country: 'IE', city: 'Dublin', postcode: 'D08 X2A3', region: 'County Dublin' },
  { country: 'AE', city: 'Dubai', postcode: '00000', region: 'Dubai' },
  { country: 'PK', city: 'Lahore', postcode: '54000', region: 'Punjab' },
];
const ORGANISATIONS = ['Leeds Traders Ltd', 'Northern Pharmacy Group', 'Roundhay Youth Circle'];

/** Where donors come from (UTM). `undefined` = direct visit. */
const SOURCES = [
  { utmSource: 'facebook', utmMedium: 'paid_social', utmCampaign: 'make-space-2026' },
  { utmSource: 'google', utmMedium: 'organic' },
  { utmSource: 'instagram', utmMedium: 'social' },
  { utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'monthly-update' },
  { utmSource: 'whatsapp', utmMedium: 'social', utmCampaign: 'channel' },
  undefined,
  undefined,
] as const;

const DAY = 86_400_000;

export function sampleDonations(today = new Date()): Donation[] {
  const rand = rng(1807);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
  const campaigns = seedDonations.programs.map((p) => p.id);
  const ref = (n: number) => `pi_sample_${(1e6 + n * 7919).toString(36)}`;

  const donors = Array.from({ length: 42 }, (_, i) => {
    const firstName = pick(FIRST);
    const lastName = pick(LAST);
    const abroad = rand() < 0.07 ? pick(ABROAD) : undefined;
    const organisation = rand() < 0.08 ? pick(ORGANISATIONS) : undefined;
    const source = pick(SOURCES);
    return {
      donor: {
        id: `donor-${String(i + 1).padStart(3, '0')}`,
        type: organisation ? ('organisation' as const) : ('personal' as const),
        ...(organisation && { organisation }),
        firstName,
        lastName,
        address: `${1 + Math.floor(rand() * 120)} ${pick(STREETS)}`,
        city: abroad?.city ?? 'Leeds',
        region: abroad?.region ?? (rand() < 0.5 ? 'West Yorkshire' : undefined),
        postcode: abroad?.postcode ?? pick(POSTCODES),
        country: abroad?.country ?? 'GB',
        email: `${firstName}.${lastName}${i + 1}@example.com`.toLowerCase(),
        phone: `07700 9${String(10000 + i * 137).slice(-5)}`,
      },
      // Gift Aid: individual UK taxpayers only.
      giftAid: !organisation && !abroad && rand() < 0.6,
      marketingConsent: rand() < 0.45,
      source: source ? { ...source, landingPage: '/donate' } : undefined,
    };
  });

  const out: Donation[] = [];
  const add = (
    d: (typeof donors)[number],
    at: Date,
    fields: Pick<Donation, 'amount' | 'type' | 'campaignId'> & Partial<Donation>,
  ) =>
    out.push({
      id: `don_${String(out.length + 1).padStart(4, '0')}`,
      createdAt: at.toISOString(),
      currency: 'GBP',
      status: rand() < 0.03 ? 'refunded' : 'succeeded',
      giftAid: d.giftAid,
      ...(d.giftAid && { giftAidDeclaredAt: new Date(at.getTime() - 60_000).toISOString() }),
      donor: d.donor,
      marketingConsent: d.marketingConsent,
      ...(d.source && { source: d.source }),
      paymentRef: ref(out.length + 1),
      ...fields,
    });

  // Regular givers: one subscription each, with payments from its start date.
  const regular = donors.filter(() => rand() < 0.3);
  regular.forEach((d, i) => {
    const weekly = rand() < 0.25;
    const step = (weekly ? 7 : 30) * DAY;
    const status = pick(['active', 'active', 'active', 'active', 'past_due', 'cancelled'] as const);
    const startedDaysAgo = 40 + Math.floor(rand() * 80);
    // Failed / cancelled plans stopped paying a while ago.
    const stoppedDaysAgo = status === 'active' ? 0 : 10 + Math.floor(rand() * 20);
    const amount = pick([5, 10, 10, 20, 25, 50]);
    const campaignId = pick(campaigns);
    const subscription = { id: `sub_sample_${String(i + 1).padStart(3, '0')}`, status };
    for (
      let t = today.getTime() - startedDaysAgo * DAY;
      t <= today.getTime() - stoppedDaysAgo * DAY;
      t += step
    )
      add(d, new Date(t), {
        amount,
        type: 'recurring',
        frequency: weekly ? 'weekly' : 'monthly',
        campaignId,
        subscription,
      });
  });

  // One-off gifts.
  for (let i = 0; i < 110; i++) {
    const at = new Date(
      today.getTime() - Math.floor(rand() * 120) * DAY - Math.floor(rand() * DAY),
    );
    add(pick(donors), at, {
      amount: pick([10, 20, 25, 50, 50, 100, 150, 250, 500, 1000]),
      type: 'one-off',
      campaignId: pick(campaigns),
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
