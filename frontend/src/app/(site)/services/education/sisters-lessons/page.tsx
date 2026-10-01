import { LessonIntro } from '@/components/services/lesson-intro';
import { PageHero } from '@/components/ui/page-hero';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Sisters’ Only Lessons',
  description:
    'Weekend activities exclusive for women at Al-Rahmah Masjid Leeds, including important lessons for every Muslim woman every Sunday afternoon.',
  path: '/services/education/sisters-lessons',
});

export default function ServicesEducationSistersLessonsPage() {
  return (
    <>
      <PageHero eyebrow="Education" title="Sisters’ only lessons" />
      {/* TODO: add the "Important Lessons for Every Muslim Woman" poster as
          public/images/services/sisters-lessons-poster.webp and pass it as `poster`. */}
      <LessonIntro
        id="sisters-lessons"
        label="Every Sunday afternoon"
        title="Sisters’ only lessons"
        description="During weekends there are several activities exclusive for women including weekly important lessons for every Muslim woman delivered by the Imam every Sunday afternoon."
      />
    </>
  );
}
