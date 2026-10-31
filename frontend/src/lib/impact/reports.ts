import type { ImpactReport } from './data';

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
  /** Key figures from the report, shown in the impact stat section. */
  figures?: ImpactReport;
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
    // From the report (pages 3, 4, 5, 7 and 10), as printed. The YouTube and TikTok view counts
    // were left out at the client's request (October 2026).
    figures: {
      year: 2026,
      intro:
        'Established in Leeds in 2018, Al-Rahmah is active throughout the week, in the masjid and online. Our community is growing, and we urgently need more space to pray, learn and grow together.',
      note: 'Figures correct as at October 2026.',
      primary: {
        label: 'Online reach',
        stats: [
          { value: 25000, suffix: '+', caption: 'YouTube subscribers' },
          { value: 34000, suffix: '+', caption: 'TikTok followers' },
          { value: 1000, suffix: '+', caption: 'WhatsApp community members' },
        ],
      },
      secondary: [
        {
          label: 'In the masjid',
          stats: [
            { value: 35, caption: 'Shahadahs taken at our masjid' },
            {
              prefix: '£',
              value: 100000,
              unit: 's',
              suffix: '+',
              caption: 'Raised by our community for humanitarian causes',
            },
          ],
        },
      ],
      featured: {
        label: 'The next chapter',
        stats: [
          { value: 1000, suffix: '+', caption: 'Worshippers, up from about 350 today' },
          { value: 200, suffix: '+', caption: 'Places for Madrasah students' },
          { prefix: '£', value: 585000, caption: 'Raised so far for the masjid expansion' },
        ],
      },
    },
  },
];
