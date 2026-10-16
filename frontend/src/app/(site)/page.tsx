import { EventsSection } from '@/components/events/events-section';
import { GreetingSection } from '@/components/home/greeting-section';
import { ImpactSection } from '@/components/impact/impact-section';
import { KhutbahsSection } from '@/components/khutbahs/khutbahs-section';
import { ServicesSection } from '@/components/services/services-section';
import { heroSlides } from '@/components/home/hero-slides';
import { HeroMobile } from '@/components/home/hero-mobile';
import { HeroSlideshow } from '@/components/home/hero-slideshow';
import { siteConfig } from '@/config/site';
import { listEvents } from '@/lib/events/repository';
import { impactReport } from '@/lib/impact/data';
import { listKhutbahs } from '@/lib/khutbahs/repository';
import { buildMetadata } from '@/lib/seo';

/** Re-render hourly so past events drop off and new khutbahs appear. */
export const revalidate = 3600;

export const metadata = buildMetadata({
  title: `${siteConfig.name} — Mosque in Leeds, established 2018`,
  description: siteConfig.description,
  path: '/',
});

export default async function HomePage() {
  const [events, khutbahs] = await Promise.all([listEvents(), listKhutbahs()]);

  return (
    <>
      {/* One hero per screen size: accordion on mobile, slideshow on desktop. */}
      <HeroMobile slides={heroSlides} events={events} />
      <HeroSlideshow slides={heroSlides} events={events} />

      <GreetingSection />
      <EventsSection events={events.slice(0, 3)} />
      <ImpactSection report={impactReport} />
      <ServicesSection />
      <KhutbahsSection khutbahs={khutbahs} />
    </>
  );
}
