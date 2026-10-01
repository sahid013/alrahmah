import Image from 'next/image';
import { ContactDetails } from '@/components/contact/contact-details';
import { ContactForm } from '@/components/contact/contact-form';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Funerals',
  description:
    'Funeral (janazah) queries for Al-Rahmah Masjid, Leeds. Email, call or send us a message and we will help your family.',
  path: '/services/funerals',
});

export default function ServicesFuneralsPage() {
  const { contact } = siteConfig;

  return (
    <>
      <PageHero eyebrow="Services" title="Funerals" />
      <section aria-labelledby="funeral-queries-title" className="py-20 sm:py-28">
        <Container className="grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <h2
                id="funeral-queries-title"
                className="text-title-3xl leading-none sm:text-title-4xl"
              >
                Funeral queries
              </h2>
            </Reveal>
            <Reveal order={1} className="mt-8">
              <ContactDetails
                email={contact.funeralsEmail}
                showAddress={false}
                showSocials={false}
              />
            </Reveal>
            <Reveal order={2} className="mt-12 border-t border-neutral-200 pt-12">
              <ContactForm to={contact.funeralsEmail} subject="Funeral query" />
            </Reveal>
          </div>
          <Reveal order={1} className="lg:col-span-6">
            <div className="relative aspect-[648/566] overflow-hidden bg-primary-50 lg:sticky lg:top-24">
              <Image
                src="/images/services/funeral-washing-room.webp"
                alt="The masjid's washing room, with a body prepared in a white shroud on the table"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
