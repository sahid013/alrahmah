import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Heading, Text } from '@/components/ui/typography';
import { WhatsAppIcon } from '@/components/icons';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About us',
  description: siteConfig.description,
  path: '/about',
});

export default function AboutPage() {
  return (
    <Container className="py-16 lg:py-24">
      <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase sm:text-sm">
        {siteConfig.address.locality} · Est. {siteConfig.foundingYear}
      </p>
      <Heading level={1} className="mt-4">
        About us
      </Heading>
      <div className="mt-8 max-w-3xl space-y-6">
        <Text size="lead">
          Al Rahmah Masjid Leeds, established in 2018, has been serving the Muslim community and the
          larger society with unwavering dedication. Over the years, it has grown to become one of
          the fastest-growing mosques in the vibrant city of Leeds.
        </Text>
        <Text size="lead">
          At Al Rahmah Masjid, the doors are open to visitors throughout the year, creating an
          atmosphere of inclusivity and warmth. Many individuals from diverse backgrounds and
          beliefs come with a desire to learn more about the mosque and the teachings of the Islamic
          faith.
        </Text>
        <Text>Join our WhatsApp channel for latest announcements and latest prayer times.</Text>
      </div>
      <ButtonLink href={siteConfig.links.whatsappChannel} className="mt-8">
        <WhatsAppIcon />
        Join our WhatsApp channel
      </ButtonLink>
    </Container>
  );
}
