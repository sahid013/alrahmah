import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Education',
  path: '/services/education',
  noindex: true,
});

export default function ServicesEducationPage() {
  return (
    <PlaceholderPage
      eyebrow="Services"
      title="Education"
      back={{ href: '/services', label: 'All services' }}
    >
      {
        'Details of our Quran academy, Sunday weekly lessons and sisters’ only lessons are coming soon.'
      }
    </PlaceholderPage>
  );
}
