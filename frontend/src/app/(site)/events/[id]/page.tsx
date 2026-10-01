import Image from 'next/image';
import { notFound } from 'next/navigation';
import { EVENTS_PAGE, eventScheduleText } from '@/lib/events';
import { getEvent, listEvents } from '@/lib/events/repository';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Heading, Text } from '@/components/ui/typography';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

/** Only events in the data exist; anything else is a 404. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listEvents()).map((event) => ({ id: event.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const event = await getEvent((await params).id);
  if (!event) return {};
  return buildMetadata({
    title: event.title,
    description: event.summary,
    path: `${EVENTS_PAGE}/${event.id}`,
    image: event.image?.src,
  });
}

export default async function EventPage({ params }: Props) {
  const event = await getEvent((await params).id);
  if (!event) notFound();

  return (
    <Container className="py-16 lg:py-24">
      <ButtonLink href={EVENTS_PAGE} variant="tertiary" size="xs">
        <ArrowRightIcon className="size-3.5 rotate-180" />
        All events &amp; courses
      </ButtonLink>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
        {event.image && (
          <div className="lg:col-span-5">
            <Image
              src={event.image.src}
              alt={event.image.alt}
              width={event.image.width}
              height={event.image.height}
              priority
              sizes="(min-width: 1024px) 28rem, 100vw"
              className="h-auto w-full max-w-md"
            />
          </div>
        )}
        <div className={event.image ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <p className="font-ui text-base font-medium text-secondary-700">
            {eventScheduleText(event)}
          </p>
          <Heading level={1} className="mt-3">
            {event.title}
          </Heading>
          {event.speaker && (
            <p className="mt-4 font-label text-sm font-bold tracking-[0.12em] text-neutral-500 uppercase">
              With {event.speaker}
            </p>
          )}
          <Text size="lead" className="mt-6 max-w-2xl">
            {event.description ?? event.summary}
          </Text>
          <Text className="mt-4 max-w-2xl">
            {siteConfig.name}, {siteConfig.address.locality}. Brothers and sisters welcome.
          </Text>
        </div>
      </div>
    </Container>
  );
}
