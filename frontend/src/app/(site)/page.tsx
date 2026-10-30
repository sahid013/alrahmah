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
import { impactReports } from '@/lib/impact/reports';
import { listKhutbahs } from '@/lib/khutbahs/repository';
import { buildMetadata } from '@/lib/seo';

/** Re-render hourly so past events drop off and new khutbahs appear. */
export const revalidate = 3600;

export const metadata = buildMetadata({
  // Client's wording (October 2026).
  title: `Al Rahmah Faith Centre - ${siteConfig.address.locality}`,
  description: siteConfig.description,
  path: '/',
  absoluteTitle: true,
});

export default async function HomePage() {
  const [events, khutbahs] = await Promise.all([listEvents(), listKhutbahs()]);
  const latestReport = impactReports[0];

  return (
    <>
      {/* The page's single h1. Both heroes stay in the HTML (one per screen size), so their
          slide titles are h2s and this heading names the page for search engines and screen readers. */}
      <h1 className="sr-only">
        {siteConfig.name}, a mosque in {siteConfig.address.locality} since {siteConfig.foundingYear}
      </h1>
      {/* One hero per screen size: accordion on mobile, slideshow on desktop. */}
      <HeroMobile slides={heroSlides} events={events} />
      <HeroSlideshow slides={heroSlides} events={events} />

      <GreetingSection />
      <EventsSection events={events.slice(0, 3)} />
      {latestReport?.figures && (
        // The newest report's figures (as on /impact-reports); the cover and button open its PDF.
        <ImpactSection
          report={{ ...latestReport.figures, reportUrl: latestReport.pdf.href }}
          cover={latestReport.cover}
        />
      )}
      <KhutbahsSection khutbahs={khutbahs} />
      <ServicesSection />
    </>
  );
}
