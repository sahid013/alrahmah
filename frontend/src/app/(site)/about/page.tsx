import { AboutHighlights } from '@/components/about/about-highlights';
import { AboutIntro } from '@/components/about/about-intro';
import { BuildingFloors } from '@/components/about/building-floors';
import { PageHero } from '@/components/ui/page-hero';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About Us',
  description:
    'Al-Rahmah Masjid in Sheepscar, Leeds: a former Congregational church bought in 2018 and turned into a two-storey mosque with prayer halls and classes.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={`${siteConfig.address.locality} · Est. ${siteConfig.foundingYear}`}
        title="About us"
      />
      <AboutIntro />
      <BuildingFloors />
      <AboutHighlights />
    </>
  );
}
