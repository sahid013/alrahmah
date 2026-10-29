import { LessonIntro } from '@/components/services/lesson-intro';
import { PageHero } from '@/components/ui/page-hero';
import { JsonLd } from '@/components/seo/json-ld';
import { buildMetadata } from '@/lib/seo';
import { flattenServices } from '@/lib/services/data';
import { servicePageJsonLd } from '@/lib/structured-data';

const description =
  'Weekend activities exclusive for women at Al-Rahmah Masjid Leeds, including important lessons for every Muslim woman every Sunday afternoon.';

export const metadata = buildMetadata({
  title: 'Sisters’ Islamic Lessons in Leeds',
  description,
  path: '/services/education/sisters-lessons',
});

/** Same photo as the lesson's preview card (`lib/services/data.ts`). */
const lesson = flattenServices().find((s) => s.href === '/services/education/sisters-lessons')!;

const structuredData = servicePageJsonLd({
  name: 'Sisters’ Only Lessons',
  serviceType: 'Islamic lessons for women',
  description,
  path: '/services/education/sisters-lessons',
});

export default function ServicesEducationSistersLessonsPage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <PageHero eyebrow="Education" title="Sisters’ only lessons" />
      <LessonIntro
        id="sisters-lessons"
        label="Every Sunday afternoon"
        title="Sisters’ only lessons"
        description="During weekends there are several activities exclusive for women including weekly important lessons for every Muslim woman delivered by the Imam every Sunday afternoon."
        image={lesson.image}
      />
    </>
  );
}
