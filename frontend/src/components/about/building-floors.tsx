import { Container } from '@/components/ui/container';
import { PatternCard } from '@/components/ui/pattern-card';
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
              <PatternCard title={floor.title} description={floor.description} />
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
