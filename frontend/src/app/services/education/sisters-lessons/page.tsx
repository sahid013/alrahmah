import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Sisters’ Only Lessons',
  path: '/services/education/sisters-lessons',
  noindex: true,
});

export default function ServicesEducationSistersLessonsPage() {
  return (
    <PlaceholderPage
      eyebrow="Education"
      title="Sisters’ Only Lessons"
      back={{ href: '/services/education', label: 'Education' }}
    >
      Details of the sisters’ only lessons are coming soon.
    </PlaceholderPage>
  );
}
