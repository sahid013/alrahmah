import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Al-Rahmah Quran Academy',
  path: '/services/education/quran-academy',
  noindex: true,
});

export default function ServicesEducationQuranAcademyPage() {
  return (
    <PlaceholderPage
      eyebrow="Education"
      title="Al-Rahmah Quran Academy"
      back={{ href: '/services/education', label: 'Education' }}
    >
      Details of the Quran academy are coming soon.
    </PlaceholderPage>
  );
}
