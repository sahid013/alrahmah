# Prayer times in Supabase: what should happen?

Fill this in (tick boxes with `[x]`, write answers after the arrows), save, and tell Claude it's ready.
Nothing changes until you do.

## How it works today

- **Default times** come from the masjid's 2026 timetable built into the code
  (`frontend/data/prayer-timetables/WEBSITE 2026.xlsx` → `frontend/src/lib/prayer-timetable-2026.ts`):
  start + jama'ah for Fajr, Dhuhr, Asr and Isha; start only for Maghrib and sunrise.
- **Supabase (`prayer_days`)** only stores days someone edits in the dashboard. Right now it holds
  **1 day**: 16 Oct 2026 (saved from shasan1807013@gmail.com, same times as the timetable,
  Jumu'ah 12:52).
- The website and the dashboard use an edited day first, then the 2026 timetable, then calculated
  times (for years with no timetable, e.g. 2027).

## 1. Where should the 2026 times live?

- [ ] **A. Copy the whole 2026 timetable into Supabase** (365 days), so Supabase holds every day and
      the dashboard shows/edits real stored values. The timetable in code stays only as a backup.
- [ ] **B. Keep it as it is**: the timetable stays in code; Supabase only holds days that are changed.

## 2. Next year (2027) and after

- [ ] Add a **"Upload timetable" button in the dashboard** (Prayer times page): staff upload the
      masjid's yearly spreadsheet (same layout as `WEBSITE 2026.xlsx`) and every day is saved to
      Supabase. No developer needed each year.
- [ ] I'll send the 2027 spreadsheet; just import it for me this time.
- [ ] Nothing for now.

2027 spreadsheet (if you have it) → put it in `frontend/data/prayer-timetables/` and write the file name here:

## 3. Jumu'ah

The sheet has no Jumu'ah time, so the website shows Dhuhr's start as Jumu'ah (e.g. 12:52).

- Khutbah / Jumu'ah time(s) in winter (GMT) →
- Khutbah / Jumu'ah time(s) in summer (BST) →
- Second Jumu'ah? (yes / no, and its time) →
- [ ] Keep showing Dhuhr's start time.

## 4. Maghrib jama'ah

The sheet has no Maghrib jama'ah, so the website shows "—".

- [ ] Show it as a number of minutes after Maghrib starts → how many minutes:
- [ ] Leave it as "—".

## 5. Days to check with the masjid

On these days the sheet's **Isha jama'ah is 1–3 minutes before Isha starts**, which looks like a typo:
6 Apr, 7 Apr, 14 Apr, 15 Sep, 1 Oct and 8 Oct (2026).

- [ ] Keep exactly as the sheet says.
- [ ] Set the jama'ah to the start time on those days.
- [ ] Corrected times (write them here):

## 6. Years with no timetable (fallback calculation)

Used only if a year has no uploaded timetable. Currently: Moonsighting Committee method, Hanafi Asr.

- [ ] That's right.
- [ ] Use instead → method: ……… Asr: Hanafi / Shafi'i

## 7. Anything else

Ramadan timetable, Eid prayer times, notes to show on specific days, etc. →
