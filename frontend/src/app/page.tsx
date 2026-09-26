import { EventsSection } from '@/components/events/events-section';
import { GreetingSection } from '@/components/home/greeting-section';
import { ImpactSection } from '@/components/impact/impact-section';
import { ServicesSection } from '@/components/services/services-section';
import { heroSlides } from '@/components/home/hero-slides';
import { HeroSlideshow } from '@/components/home/hero-slideshow';
import { siteConfig } from '@/config/site';
import { listEvents } from '@/lib/events/repository';
import { impactReport } from '@/lib/impact/data';
import { buildMetadata } from '@/lib/seo';

/** Re-render hourly so past events drop off the list. */
export const revalidate = 3600;

export const metadata = buildMetadata({
  title: `${siteConfig.name} — Mosque in Leeds, established 2018`,
  description: siteConfig.description,
  path: '/',
});

export default async function HomePage() {
  const events = await listEvents();

  return (
    <>
      <HeroSlideshow slides={heroSlides} events={events} />

      <GreetingSection />
      <EventsSection events={events.slice(0, 4)} />
      <ImpactSection report={impactReport} />
      <ServicesSection />
    </>
  );
}
