import { ContactDetails } from '@/components/contact/contact-details';
import { ContactForm } from '@/components/contact/contact-form';
import { ContactMap } from '@/components/contact/contact-map';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/ui/reveal';
import { siteConfig } from '@/config/site';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with Al-Rahmah Masjid, 6 Sheepscar Way, Leeds LS7 3JB. Email, call or send us a message.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow={siteConfig.name} title="Contact Us" />
      <section aria-labelledby="get-in-touch-title" className="py-20 sm:py-28">
        <Container className="grid gap-16 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Reveal>
              <h2 id="get-in-touch-title" className="text-title-3xl leading-none sm:text-title-4xl">
                Get in touch
              </h2>
            </Reveal>
            <Reveal order={1} className="mt-8">
              <ContactDetails />
            </Reveal>
            <Reveal order={2} className="mt-12 border-t border-neutral-200 pt-12">
              <ContactForm />
            </Reveal>
          </div>
          <Reveal order={1} className="lg:col-span-6">
            <ContactMap />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
