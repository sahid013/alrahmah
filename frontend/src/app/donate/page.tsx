import { AppealWordmark } from '@/components/home/hero-visuals';
import { Container } from '@/components/ui/container';
import { Heading, Text } from '@/components/ui/typography';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Donate — Make Space for Rahmah appeal',
  description:
    'Help Al-Rahmah Masjid Leeds move to a larger building so no one has to pray outside. Support the Make Space for Rahmah appeal.',
  path: '/donate',
});

export default function DonatePage() {
  return (
    <>
      {/* Pulled up under the transparent header. */}
      <div className="-mt-16 bg-primary-900 pt-[calc(4rem+4rem)] pb-16 lg:-mt-[4.5rem] lg:pt-[calc(4.5rem+4rem)]">
        <Container>
          <AppealWordmark />
        </Container>
      </div>
      <Container className="py-16">
        <Heading level={1}>Support our appeal</Heading>
        <Text size="lead" className="mt-6 max-w-2xl">
          We have reached our capacity at our current premises and we need YOUR help in order to
          move to a larger building. We can then serve the community better. Our congregation no
          longer will have to pray outside and parking will no longer be an issue.
        </Text>
        {/* TODO: replace with the donation form once the payment system is built. */}
        <Text className="mt-8 border-l-2 border-secondary-500 bg-secondary-50 p-4">
          Online donations are coming soon.
        </Text>
      </Container>
    </>
  );
}
