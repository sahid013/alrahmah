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

export function sampleDonations(today = new Date()): Donation[] {
  const rand = rng(1807);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
  const campaigns = seedDonations.programs.map((p) => p.id);

  const donors = Array.from({ length: 42 }, (_, i) => {
    const firstName = pick(FIRST);
    const lastName = pick(LAST);
    return {
      id: `donor-${String(i + 1).padStart(3, '0')}`,
      title: pick(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', undefined]),
      firstName,
      lastName,
      email: `${firstName}.${lastName}${i + 1}@example.com`.toLowerCase(),
      houseNameOrNumber: String(1 + Math.floor(rand() * 120)),
      postcode: pick(POSTCODES),
      giftAid: rand() < 0.55,
    };
  });

  const out: Donation[] = [];
  for (let i = 0; i < 160; i++) {
    const donor = pick(donors);
    const daysAgo = Math.floor(rand() * 120);
    const at = new Date(today.getTime() - daysAgo * 86_400_000 - Math.floor(rand() * 86_400_000));
    const recurring = rand() < 0.3;
    const amount = recurring
      ? pick([5, 10, 10, 20, 25, 50])
      : pick([10, 20, 25, 50, 50, 100, 150, 250, 500, 1000]);
    const { giftAid, ...donorFields } = donor;
    out.push({
      id: `don_${String(i + 1).padStart(4, '0')}`,
      createdAt: at.toISOString(),
      amount,
      currency: 'GBP',
      type: recurring ? 'recurring' : 'one-off',
      ...(recurring && { frequency: rand() < 0.2 ? 'weekly' : 'monthly' }),
      campaignId: pick(campaigns),
      status: rand() < 0.03 ? 'refunded' : 'succeeded',
      giftAid,
      donor: donorFields,
      paymentRef: `pi_sample_${(1e6 + i * 7919).toString(36)}`,
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
