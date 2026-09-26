import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Services',
  path: '/services',
  noindex: true,
});

export default function ServicesPage() {
  return (
    <PlaceholderPage title="Our Services">
      Funerals, education and nikah services at Al-Rahmah Masjid are coming soon to this page.
    </PlaceholderPage>
  );
}
