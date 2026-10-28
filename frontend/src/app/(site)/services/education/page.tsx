import type { CSSProperties } from 'react';
import { JsonLd } from '@/components/seo/json-ld';
import { CourseCard } from '@/components/services/course-card';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { StaggerGroup } from '@/components/ui/stagger-group';
import { services } from '@/lib/services/data';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbJsonLd } from '@/lib/structured-data';

const education = services.find((s) => s.href === '/services/education')!;
const courses = education.children ?? [];

export const metadata = buildMetadata({
  title: 'Islamic Education in Leeds',
  description:
    'Quran Academy for children aged 5–15, Sunday lessons open to all and sisters’ only lessons at Al-Rahmah Masjid, Leeds.',
  path: '/services/education',
});

/** Education overview: the academy and weekly lessons, each with its key facts and page link. */
export default function ServicesEducationPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Education', path: '/services/education' }])} />
      <PageHero eyebrow="Services" title="Education" />

      <section aria-labelledby="education-title" className="py-20 sm:py-28">
        <Container>
          <Reveal className="max-w-3xl">
            <h2 id="education-title" className="text-title-3xl leading-none sm:text-title-4xl">
              Learning at the masjid
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl">
              The masjid has always been a place of study. Children learn the Qur’an and Islamic
              studies at our Quran Academy, and weekly lessons on Sundays are open to the whole
              community, with a lesson for sisters only.
            </p>
          </Reveal>

          <StaggerGroup>
            <ul className="mt-14 grid gap-8 md:grid-cols-3 lg:gap-10">
              {courses.map((course, i) => (
                <CourseCard
                  key={course.href}
                  course={course}
                  className="stagger-item"
                  style={{ '--i': i } as CSSProperties}
                />
              ))}
            </ul>
          </StaggerGroup>
        </Container>
      </section>
    </>
  );
}
