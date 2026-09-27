import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { highlights } from '@/lib/about/data';

/** Three short columns (Services, Brotherhood, Masjid History) split by hairlines. */
export function AboutHighlights() {
  return (
    <section aria-label="About the masjid" className="py-20 sm:py-28">
      <Container>
        <div className="grid divide-y divide-neutral-200 md:grid-cols-3 md:divide-x md:divide-y-0">
          {highlights.map((item, i) => (
            <Reveal
              key={item.title}
              order={i}
              className="py-10 first:pt-0 last:pb-0 md:px-10 md:py-0 md:first:pl-0 md:last:pr-0"
            >
              <span aria-hidden className="block h-0.5 w-10 bg-secondary-500" />
              <h2 className="mt-6 text-title-2xl leading-none sm:text-title-3xl">{item.title}</h2>
              <p className="mt-4 text-lg leading-relaxed text-pretty text-neutral-600">
                {item.description}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
