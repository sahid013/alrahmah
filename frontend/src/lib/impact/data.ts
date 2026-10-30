/**
 * Shape of a report's key figures, shown by `ImpactSection`. The figures themselves live with
 * each published report in `reports.ts`; the home page shows the newest one.
 */

export interface ImpactStat {
  value: number;
  /** e.g. "£" for "£585,000". */
  prefix?: string;
  /** Full-size unit after the number, e.g. "m" for "2.8m". */
  unit?: string;
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
  /** Small print under the intro, e.g. when the figures were correct. */
  note?: string;
  /** PDF or page for the full report; the button only shows when set. */
  reportUrl?: string;
  /** Left column. */
  primary: ImpactGroup;
  /** Middle column (shown side by side). */
  secondary: ImpactGroup[];
  /** Right highlighted panel. */
  featured: ImpactGroup;
}
