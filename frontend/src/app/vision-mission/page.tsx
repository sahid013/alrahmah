import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Vision & Mission',
  path: '/vision-mission',
  noindex: true,
});

export default function VisionMissionPage() {
  return (
    <PlaceholderPage title="Vision & Mission">
      Our vision and mission statements are coming soon.
    </PlaceholderPage>
  );
}
