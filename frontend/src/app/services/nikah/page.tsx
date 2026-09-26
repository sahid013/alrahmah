import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Nikah (Marriage)',
  path: '/services/nikah',
  noindex: true,
});

export default function ServicesNikahPage() {
  return (
    <PlaceholderPage
      eyebrow="Services"
      title="Nikah (Marriage)"
      back={{ href: '/services', label: 'All services' }}
    >
      Information about nikah (marriage) services is coming soon.
    </PlaceholderPage>
  );
}
