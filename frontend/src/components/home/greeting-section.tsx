import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { siteConfig } from '@/config/site';

/**
 * Welcome section: the greeting in Arabic, then English, beside the masjid introduction and one call
 * to action. Lines reveal in sequence as the section scrolls into view.
 */
export function GreetingSection() {
  return (
    <section aria-labelledby="greeting-title" className="bg-primary-50 py-20 sm:py-28 lg:py-32">
      <Container className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-20">
        {/* Greeting: Arabic first, then English. */}
        <div>
          <Reveal>
            <p
              lang="ar"
              dir="rtl"
              className="text-left font-arabic text-6xl leading-[1.6] text-primary-500 sm:text-7xl lg:text-8xl"
            >
              السلام عليكم
            </p>
          </Reveal>
          <Reveal order={1}>
            <span aria-hidden className="mt-4 block h-1 w-16 bg-secondary-500" />
            <h2 id="greeting-title" className="mt-6 text-title-3xl leading-none sm:text-title-4xl">
              Assalamu Alaykum
            </h2>
            <p className="mt-3 font-label text-sm font-bold tracking-[0.3em] text-secondary-700 uppercase">
              Peace be upon you
            </p>
          </Reveal>
        </div>

        {/* Introduction and call to action. */}
        <div>
          <Reveal order={2}>
            <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl">
              <p>
                Al Rahmah Masjid Leeds, established in 2018, has been serving the Muslim community
                and the larger society with unwavering dedication. Over the years, it has grown to
                become one of the fastest-growing mosques in the vibrant city of Leeds.
              </p>
              <p>
                At Al Rahmah Masjid, the doors are open to visitors throughout the year, creating an
                atmosphere of inclusivity and warmth. Many individuals from diverse backgrounds and
                beliefs come with a desire to learn more about the mosque and the teachings of the
                Islamic faith.
              </p>
              <p>
                Join our{' '}
                <a
                  href={siteConfig.links.whatsappChannel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary-500 underline underline-offset-4 hover:text-secondary-700"
                >
                  WhatsApp channel
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>{' '}
                for latest announcements and latest prayer times.
              </p>
            </div>
            <ButtonLink href="/about" size="lg" className="mt-10">
              Learn about us
              <ArrowRightIcon />
            </ButtonLink>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
