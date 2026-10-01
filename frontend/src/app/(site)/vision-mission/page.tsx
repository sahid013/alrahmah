import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { PatternCard } from '@/components/ui/pattern-card';
import { Reveal } from '@/components/ui/reveal';
import { siteConfig } from '@/config/site';
import { visionMission } from '@/lib/about/data';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Vision & Mission',
  description:
    'Al-Rahmah Masjid seeks to inspire, educate and serve, and to become a beacon for Leeds with first-class facilities and leading services.',
  path: '/vision-mission',
});

export default function VisionMissionPage() {
  return (
    <>
      <PageHero eyebrow={siteConfig.name} title="Vision & Mission" />
      <section aria-label="Our mission and vision" className="py-20 sm:py-28">
        <Container className="grid gap-4 md:grid-cols-2">
          {visionMission.map((item, i) => (
            <Reveal key={item.title} order={i} className="h-full">
              <PatternCard title={item.title} description={item.description} />
            </Reveal>
          ))}
        </Container>
      </section>
    </>
  );
}
