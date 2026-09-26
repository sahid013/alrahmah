import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Contact Us',
  path: '/contact',
  noindex: true,
});

export default function ContactPage() {
  return <PlaceholderPage title="Contact Us">Contact details are coming soon.</PlaceholderPage>;
}
