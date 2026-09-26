/**
 * Yearly impact report shown on the home page.
 *
 * TODO: SAMPLE FIGURES — every number below is a placeholder and must be replaced with the
 * masjid's real figures before launch (later this can come from the dashboard / API).
 */

export interface ImpactStat {
  value: number;
  /** e.g. "+" for "3000+". */
  suffix?: string;
  caption: string;
}

export interface ImpactGroup {
  label: string;
  stats: ImpactStat[];
}

export interface ImpactReport {
  year: number;
  intro: string;
  /** PDF or page for the full report; the button only shows when set. */
  reportUrl?: string;
  /** Left column. */
  primary: ImpactGroup;
  /** Middle column (shown side by side). */
  secondary: ImpactGroup[];
  /** Right highlighted panel. */
  featured: ImpactGroup;
}

export const impactReport: ImpactReport = {
  year: 2025,
  // TODO: point this at the published PDF (e.g. '/reports/impact-2025.pdf') when it exists.
  reportUrl: '/impact/2025',
  intro:
    'Alhamdulillah, 2025 was another year of growth for Al-Rahmah Masjid. With your support we welcomed more worshippers, students and visitors than ever, and we look ahead with renewed hope as we work towards our new home.',
  primary: {
    label: 'Volunteering',
    stats: [
      { value: 120, suffix: '+', caption: 'Volunteers engaged' },
      { value: 4200, caption: 'Volunteer hours' },
    ],
  },
  secondary: [
    { label: 'Education', stats: [{ value: 850, caption: 'Course attendances' }] },
    { label: 'Ramadan', stats: [{ value: 6500, caption: 'Iftar meals served' }] },
  ],
  featured: {
    label: 'Community',
    stats: [
      { value: 15000, suffix: '+', caption: "Worshippers at Jumu'ah" },
      { value: 900, caption: 'Visitors welcomed' },
      { value: 350, caption: 'Youth programme attendances' },
    ],
  },
};
