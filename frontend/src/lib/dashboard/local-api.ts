import type { DashboardApi } from './api';
import { createLocalAuth } from './auth/local-auth';
import { filterDonations } from './queries';
import { sampleCampaigns, sampleDonations } from './sample-data';
import { campaignSchema, prayerDaySchema, type Campaign, type PrayerDay } from './types';

/**
 * Preview implementation of `DashboardApi`: stores edits in this browser's localStorage and
 * serves generated sample donations. Not for production — swap for the Supabase/backend
 * implementation when it exists. Client-side only.
 */
const KEY = 'alrahmah.dashboard.v2'; // v2: causes reduced to three, no posters

interface Store {
  prayer: Record<string, PrayerDay>;
  campaigns: Campaign[];
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      return {
        prayer: Object.fromEntries(
          Object.entries(parsed.prayer ?? {}).filter(
            ([, d]) => prayerDaySchema.safeParse(d).success,
          ),
        ),
        campaigns: campaignSchema.array().catch(sampleCampaigns()).parse(parsed.campaigns),
      };
    }
  } catch {
    /* storage unavailable or corrupt: fall back to defaults */
  }
  return { prayer: {}, campaigns: sampleCampaigns() };
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    throw new Error(
      'This browser has run out of space for preview data. Try a smaller image or clear old drafts.',
    );
  }
}

/** Small artificial delay so loading states behave like a real network. */
const settle = <T>(value: T) => new Promise<T>((r) => setTimeout(() => r(value), 120));
const now = () => new Date().toISOString();

export function createLocalDashboardApi(): DashboardApi {
  const donations = sampleDonations();

  return {
    ...createLocalAuth(),
    prayer: {
      async listDays(from, to) {
        const days = Object.values(read().prayer).filter((d) => d.date >= from && d.date <= to);
        return settle(days.sort((a, b) => a.date.localeCompare(b.date)));
      },
      async saveDay(day) {
        const valid = prayerDaySchema.parse({ ...day, updatedAt: now() });
        const store = read();
        store.prayer[valid.date] = valid;
        write(store);
        return settle(valid);
      },
      async saveDays(days) {
        const store = read();
        for (const d of days)
          store.prayer[d.date] = prayerDaySchema.parse({ ...d, updatedAt: now() });
        write(store);
        return settle(undefined);
      },
      async deleteDay(date) {
        const store = read();
        delete store.prayer[date];
        write(store);
        return settle(undefined);
      },
    },
    campaigns: {
      async list() {
        return settle([...read().campaigns].sort((a, b) => a.order - b.order));
      },
      async get(id) {
        return settle(read().campaigns.find((c) => c.id === id));
      },
      async save(campaign) {
        const valid = campaignSchema.parse({ ...campaign, updatedAt: now() });
        const store = read();
        const i = store.campaigns.findIndex((c) => c.id === valid.id);
        if (i === -1) store.campaigns.push(valid);
        else store.campaigns[i] = valid;
        write(store);
        return settle(valid);
      },
      async remove(id) {
        const store = read();
        store.campaigns = store.campaigns.filter((c) => c.id !== id);
        write(store);
        return settle(undefined);
      },
      async reorder(ids) {
        const store = read();
        const position = new Map(ids.map((id, i) => [id, i]));
        store.campaigns = store.campaigns.map((c) => ({
          ...c,
          order: position.get(c.id) ?? ids.length + c.order,
        }));
        write(store);
        return settle(undefined);
      },
    },
    donations: {
      async list(query) {
        return settle(filterDonations(donations, query));
      },
    },
  };
}
