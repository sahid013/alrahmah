import { LessonIntro } from '@/components/services/lesson-intro';
import { PageHero } from '@/components/ui/page-hero';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Sunday Weekly Lessons',
  description:
    'Every Sunday evening, knowledge-based interactive lessons at Al-Rahmah Masjid Leeds on key Islamic beliefs and practices, open to all.',
  path: '/services/education/sunday-lessons',
});

export default function ServicesEducationSundayLessonsPage() {
  return (
    <>
      <PageHero eyebrow="Education" title="Sunday Weekly Lessons" />
      <LessonIntro
        id="sunday-lessons"
        label="Every Sunday evening"
        title="Sunday Weekly Lessons"
        description="Every Sunday evening we provide knowledge-based interactive lessons for the community focusing on key Islamic beliefs and practices. Lessons are engaging and interactive for all."
        poster={{
          src: '/images/events/names-of-allaah-poster.webp',
          alt: 'Understanding the Beautiful Names of Allaah — lesson poster from Al-Rahmah Faith Centre',
          width: 1000,
          height: 1399,
        }}
      />
    </>
  );
}
