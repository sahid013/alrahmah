import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Funerals',
  path: '/services/funerals',
  noindex: true,
});

export default function ServicesFuneralsPage() {
  return (
    <PlaceholderPage
      eyebrow="Services"
      title="Funerals"
      back={{ href: '/services', label: 'All services' }}
    >
      Information about funeral (janazah) services is coming soon.
    </PlaceholderPage>
  );
}
