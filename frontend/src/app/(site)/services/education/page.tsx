import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import { JsonLd } from '@/components/seo/json-ld';
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
                <li
                  key={course.href}
                  className="stagger-item"
                  style={{ '--i': i } as CSSProperties}
                >
                  <Link
                    href={course.href}
                    className="group flex h-full flex-col border border-neutral-200 bg-white transition-colors duration-500 hover:border-primary-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-500"
                  >
                    {course.image && (
                      <div className="relative aspect-[4/3] overflow-hidden bg-primary-50">
                        <Image
                          src={course.image.src}
                          alt={course.image.alt}
                          fill
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6 sm:p-8">
                      {course.facts && (
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 font-label text-xs font-bold tracking-[0.12em] text-secondary-700 uppercase">
                          {course.facts.map((fact) => (
                            <li key={fact}>{fact}</li>
                          ))}
                        </ul>
                      )}
                      <h3 className="mt-3 text-title-2xl leading-tight text-primary-900">
                        {course.title}
                      </h3>
                      <p className="mt-3 leading-relaxed text-neutral-600">{course.summary}</p>
                      <span className="mt-auto inline-flex items-center gap-2 pt-6 font-label text-sm font-bold tracking-[0.12em] text-primary-500 uppercase transition-colors group-hover:text-secondary-700">
                        Learn more
                        <ArrowRightIcon className="size-4" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerGroup>
        </Container>
      </section>
    </>
  );
}
