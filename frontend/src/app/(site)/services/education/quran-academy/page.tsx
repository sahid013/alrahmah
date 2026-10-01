import Image from 'next/image';
import { ContactForm } from '@/components/contact/contact-form';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Al-Rahmah Quran Academy',
  description:
    'Qur’an and Islamic studies for children aged 5 to 15 at Al-Rahmah Masjid Leeds, Monday to Thursday between 5pm and 7pm.',
  path: '/services/education/quran-academy',
});

/** Key facts from the academy copy, shown as a quick-read strip. */
const facts = [
  { value: '100+', label: 'Students' },
  { value: '5–15', label: 'Years old' },
  { value: 'Mon–Thu', label: '1 hour a day, 5pm–7pm' },
];

const paragraph = 'text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl';

export default function QuranAcademyPage() {
  return (
    <>
      <PageHero eyebrow="Education" title="Al-Rahmah Quran Academy" />

      <section aria-labelledby="academy-title" className="py-20 sm:py-28">
        <Container className="grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <h2 id="academy-title" className="text-title-3xl leading-none sm:text-title-4xl">
                Al-Rahmah Quran Academy
              </h2>
            </Reveal>
            <div className="mt-8 max-w-3xl space-y-6">
              <Reveal order={1}>
                <p className={paragraph}>
                  The Masjid has always been a place of study and education, imparting knowledge of
                  the Qur’an and general Islamic studies.
                </p>
              </Reveal>
              <Reveal order={2}>
                <p className={paragraph}>
                  Currently, we have over 100 students aged from 5 to 15 years old being taught by
                  female and male teachers under the supervision of Imam Umar Muqaddam. The academy
                  runs weekly from Monday to Thursday one hour a day between 5pm to 7pm.
                </p>
              </Reveal>
            </div>
            <Reveal order={3}>
              <dl className="mt-10 grid grid-cols-3 divide-x divide-neutral-200 border-y border-neutral-200">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col px-4 py-5 first:pl-0">
                    <dt className="order-2 mt-1 text-sm leading-snug text-neutral-500">
                      {fact.label}
                    </dt>
                    <dd className="order-1 font-ui text-lg font-semibold whitespace-nowrap text-primary-500 sm:text-2xl">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <Reveal order={1} className="lg:col-span-6">
            <Image
              src="/images/services/quran-academy-logo.webp"
              alt="Al Rahmah Quran Academy, Leeds, UK — gold crest logo"
              width={1024}
              height={680}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="w-full"
            />
          </Reveal>
        </Container>
      </section>

      <section aria-labelledby="register-title" className="bg-primary-50 py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase sm:text-sm">
              Waiting list
            </p>
            <h2 id="register-title" className="mt-3 text-title-3xl leading-none sm:text-title-4xl">
              Register your interest
            </h2>
            <p className={`mt-6 ${paragraph}`}>
              Kindly note there is currently a waiting list to join. Please fill out the online form
              below to register your interest today for your child to join the academy. For further
              enquires please contact the masjid.
            </p>
          </Reveal>
          <Reveal order={1} className="lg:col-span-7">
            <ContactForm
              subject="Quran Academy registration"
              messageLabel="About your child"
              messagePlaceholder="Your child’s name and age, and anything we should know"
            />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
