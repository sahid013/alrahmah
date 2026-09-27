import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { floors, floorsNote } from '@/lib/about/data';

/** The two storeys of the masjid, on patterned indigo cards, with a short closing note. */
export function BuildingFloors() {
  return (
    <section aria-label="The building" className="bg-primary-50 py-20 sm:py-28">
      <Container>
        <div className="grid gap-4 md:grid-cols-2">
          {floors.map((floor, i) => (
            <Reveal key={floor.title} order={i} className="h-full">
              <article className="relative isolate flex h-full flex-col items-center justify-center overflow-hidden bg-primary-700 px-6 py-14 text-center sm:px-10 sm:py-16">
                <div
                  aria-hidden
                  className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.07]"
                />
                <h2 className="text-title-2xl text-white sm:text-title-3xl">{floor.title}</h2>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-pretty text-primary-100">
                  {floor.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal order={floors.length}>
          <p className="mx-auto mt-12 max-w-3xl text-center text-lg leading-relaxed text-pretty text-neutral-600 sm:text-xl">
            {floorsNote}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
