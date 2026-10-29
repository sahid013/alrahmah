import { ReportCard } from '@/components/impact/report-card';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { siteConfig } from '@/config/site';
import { impactReports } from '@/lib/impact/reports';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Impact Reports',
  description:
    'Read and download Al-Rahmah Masjid’s impact reports: what the community achieved together in Leeds, and our vision for the future.',
  path: '/impact-reports',
});

export default function ImpactReportsPage() {
  return (
    <>
      <PageHero eyebrow={siteConfig.name} title="Impact Reports" />
      <section aria-label="Impact reports" className="py-20 sm:py-28">
        <Container className="divide-y divide-neutral-200">
          {impactReports.map((report) => (
            <div key={report.id} className="py-16 first:pt-0 last:pb-0 lg:py-24">
              <ReportCard report={report} />
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}
