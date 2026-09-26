import { PlaceholderPage } from '@/components/ui/placeholder-page';
import { buildMetadata } from '@/lib/seo';

// TODO: placeholder — add real content, then remove `noindex` and add the route to sitemap.ts.
export const metadata = buildMetadata({
  title: 'Sunday Weekly Lessons',
  path: '/services/education/sunday-lessons',
  noindex: true,
});

export default function ServicesEducationSundayLessonsPage() {
  return (
    <PlaceholderPage
      eyebrow="Education"
      title="Sunday Weekly Lessons"
      back={{ href: '/services/education', label: 'Education' }}
    >
      Details of the Sunday weekly lessons are coming soon.
    </PlaceholderPage>
  );
}
