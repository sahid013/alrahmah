import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { aboutIntro, aboutStatement } from '@/lib/about/data';

/** Who we are: the masjid's story beside the building, closing on a highlighted statement. */
export function AboutIntro() {
  return (
    <section aria-label="Our story" className="py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <div className="max-w-3xl space-y-6">
            {aboutIntro.map((paragraph, i) => (
              <Reveal key={paragraph} order={i}>
                <p className="text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl">
                  {paragraph}
                </p>
              </Reveal>
            ))}
            <Reveal order={aboutIntro.length}>
              <p className="border-l-2 border-secondary-500 pl-5 text-lg leading-relaxed text-pretty text-primary-900 sm:text-xl">
                {aboutStatement}
              </p>
            </Reveal>
          </div>
        </div>

        {/* Building cut-out on a light indigo panel (flat, no frame). */}
        <Reveal order={1} className="lg:col-span-5">
          <div className="flex aspect-square items-end justify-center bg-primary-50 px-6 pt-16">
            <Image
              src="/images/hero/al-rahmah-centre.webp"
              alt="The Al-Rahmah Masjid building in Leeds"
              width={1227}
              height={868}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="w-full object-contain"
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
