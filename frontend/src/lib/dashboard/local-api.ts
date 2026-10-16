import type { DashboardApi } from './api';
import { createLocalAuth } from './auth/local-auth';
import { filterDonations } from './queries';
import { sampleCampaigns, sampleDonations } from './sample-data';
import { byNewest, khutbahEntrySchema, type KhutbahEntry } from '@/lib/khutbahs/types';
import {
  campaignSchema,
  dashboardEventSchema,
  prayerDaySchema,
  type Campaign,
  type DashboardEvent,
  type PrayerDay,
} from './types';
import { seedEvents } from '@/lib/events/data';

/**
 * Preview implementation of `DashboardApi`: stores edits in this browser's localStorage and
 * serves generated sample donations. Not for production — swap for the Supabase/backend
 * implementation when it exists. Client-side only.
 */
const KEY = 'alrahmah.dashboard.v2'; // v2: causes reduced to three, no posters

interface Store {
  prayer: Record<string, PrayerDay>;
  campaigns: Campaign[];
  khutbahs: KhutbahEntry[];
  events?: DashboardEvent[];
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
        khutbahs: khutbahEntrySchema
          .array()
          .catch([])
          .parse(parsed.khutbahs ?? []),
        ...(parsed.events && {
          events: dashboardEventSchema.array().catch([]).parse(parsed.events),
        }),
      };
    }
  } catch {
    /* storage unavailable or corrupt: fall back to defaults */
  }
  return { prayer: {}, campaigns: sampleCampaigns(), khutbahs: [] };
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
  /** Stored events, or the site's events to start from (all published, in order). */
  const events = (): DashboardEvent[] =>
    read().events ??
    seedEvents.map((e, i) => dashboardEventSchema.parse({ ...e, status: 'published', order: i }));

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
    events: {
      async list() {
        return settle([...events()].sort((a, b) => a.order - b.order));
      },
      async get(id) {
        return settle(events().find((e) => e.id === id));
      },
      async save(event) {
        const valid = dashboardEventSchema.parse({ ...event, updatedAt: now() });
        const store = read();
        store.events = [...events().filter((e) => e.id !== valid.id), valid];
        write(store);
        return settle(valid);
      },
      async remove(id) {
        const store = read();
        store.events = events().filter((e) => e.id !== id);
        write(store);
        return settle(undefined);
      },
      async reorder(ids) {
        const store = read();
        const position = new Map(ids.map((id, i) => [id, i]));
        store.events = events().map((e) => ({ ...e, order: position.get(e.id) ?? e.order }));
        write(store);
        return settle(undefined);
      },
      async uploadPoster(file) {
        // Preview only: keep the image in the browser as a data URL.
        const src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Could not read the image.'));
          reader.readAsDataURL(file);
        });
        return settle({ src });
      },
    },
    khutbahs: {
      async list() {
        return settle([...read().khutbahs].sort(byNewest));
      },
      async save(entry, previousVideoId) {
        const valid = khutbahEntrySchema.parse({ ...entry, updatedAt: now() });
        const store = read();
        const moving = previousVideoId && previousVideoId !== valid.videoId;
        if (moving && store.khutbahs.some((k) => k.videoId === valid.videoId))
          throw new Error('That video is already posted. Edit or remove that one instead.');
        store.khutbahs = [
          valid,
          ...store.khutbahs.filter(
            (k) => k.videoId !== valid.videoId && k.videoId !== previousVideoId,
          ),
        ];
        write(store);
        return settle(valid);
      },
      async remove(videoId) {
        const store = read();
        store.khutbahs = store.khutbahs.filter((k) => k.videoId !== videoId);
        write(store);
        return settle(undefined);
      },
    },
  };
}
