/**
 * Published impact reports, newest first, shown on `/impact-reports`. Add a report by adding an
 * entry: its PDF goes in `public/impact reports/`, and a WebP of its first page (the preview) in
 * `public/images/impact/`.
 */
export interface PublishedReport {
  id: string;
  title: string;
  year: number;
  summary: string;
  /** The PDF, as served from `public/` (URL-encoded). */
  pdf: { href: string; fileName: string };
  /** The report's first page. */
  cover: { src: string; alt: string; width: number; height: number };
}

export const impactReports: PublishedReport[] = [
  {
    id: 'impact-vision-2026',
    title: 'Impact & Vision Report 2026',
    year: 2026,
    summary:
      'Our community is growing. We urgently need more space to pray, learn and grow together. Read what Al-Rahmah has achieved with your support, and our vision for the years ahead.',
    pdf: {
      href: '/impact%20reports/Al%20Rahmah%20Impact%20Report%20Website.pdf',
      fileName: 'Al-Rahmah-Impact-and-Vision-Report-2026.pdf',
    },
    cover: {
      src: '/images/impact/impact-vision-report-2026.webp',
      alt: 'Cover of the Al-Rahmah Faith Centre Impact & Vision Report 2026: Make Space For Rahmah',
      width: 1600,
      height: 1131,
    },
  },
];
