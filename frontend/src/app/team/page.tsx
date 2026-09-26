import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Meet The Team',
  path: '/team',
  noindex: true,
});

export default function TeamPage() {
  return <PlaceholderPage title="Meet The Team">Team profiles are coming soon.</PlaceholderPage>;
}
