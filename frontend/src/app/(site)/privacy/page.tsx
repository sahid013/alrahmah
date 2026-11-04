import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Heading, Text } from '@/components/ui/typography';
import { siteConfig } from '@/config/site';
import {
  PRIVACY_PROVIDERS,
  PRIVACY_RIGHTS,
  PRIVACY_UPDATED,
  PRIVACY_USES,
} from '@/lib/privacy/notice';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Privacy Notice',
  description: `How ${siteConfig.legalName} uses the personal data you give us on the ${siteConfig.name} website, and your rights.`,
  path: '/privacy',
});

const link = 'text-primary-500 underline underline-offset-4 hover:text-secondary-700';

export default function PrivacyPage() {
  const { contact, legalName, address } = siteConfig;
  const email = contact.email && (
    <a href={`mailto:${contact.email}`} className={link}>
      {contact.email}
    </a>
  );

  return (
    <>
      <PageHero eyebrow="Your privacy" title="Privacy Notice" />
      <Container className="max-w-4xl py-16 lg:py-24">
        <Text size="lead">
          This notice explains what personal data {legalName} (the charity that runs{' '}
          {siteConfig.name}, {address.street}, {address.locality} {address.postalCode}) collects
          through this website, why, who it is shared with and your rights. We are the data
          controller. We never sell your information.
        </Text>
        <Text className="mt-4">
          For cookies and similar storage in your browser, see our{' '}
          <Link href="/cookies" className={link}>
            cookie policy
          </Link>
          .
        </Text>

        {PRIVACY_USES.map((section) => (
          <section key={section.id} aria-labelledby={`privacy-${section.id}`} className="mt-14">
            <Heading level={2} size={4} id={`privacy-${section.id}`}>
              {section.title}
            </Heading>
            {section.paragraphs.map((p) => (
              <Text key={p} className="mt-3">
                {p}
              </Text>
            ))}
          </section>
        ))}

        <section aria-labelledby="privacy-providers" className="mt-14">
          <Heading level={2} size={4} id="privacy-providers">
            Who we share it with
          </Heading>
          <Text className="mt-3">
            These organisations receive personal data from the website, only for the purposes below.
            Some of them may process it outside the UK; where they do, they use the safeguards UK
            data protection law requires.
          </Text>
          <div className="relative mt-6 overflow-x-auto border border-neutral-200">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-primary-50 font-label text-xs tracking-[0.12em] text-primary-900 uppercase">
                <tr>
                  <th scope="col" className="p-3">
                    Service
                  </th>
                  <th scope="col" className="p-3">
                    Provider
                  </th>
                  <th scope="col" className="p-3">
                    What it does
                  </th>
                  <th scope="col" className="p-3">
                    Personal data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 align-top">
                {PRIVACY_PROVIDERS.map((row) => (
                  <tr key={row.service}>
                    <td className="p-3 font-bold text-primary-900">{row.service}</td>
                    <td className="p-3">{row.provider}</td>
                    <td className="p-3 leading-relaxed">{row.purpose}</td>
                    <td className="p-3 leading-relaxed">{row.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="privacy-keeping" className="mt-14">
          <Heading level={2} size={4} id="privacy-keeping">
            How long we keep it
          </Heading>
          <Text className="mt-3">
            Donation and Gift Aid records: at least six years, as HMRC requires. The mailing list:
            until you unsubscribe (we keep a record that you did). Contact messages: as long as we
            need them to deal with your enquiry. Payment attempt records: seven days.
          </Text>
        </section>

        <section aria-labelledby="privacy-rights" className="mt-14">
          <Heading level={2} size={4} id="privacy-rights">
            Your rights
          </Heading>
          <Text className="mt-3">Under UK data protection law you can:</Text>
          <ul className="mt-3 list-disc space-y-1 pl-6 text-neutral-600">
            {PRIVACY_RIGHTS.map((right) => (
              <li key={right}>{right}</li>
            ))}
          </ul>
          <Text className="mt-4">
            To use any of these rights, or with any question about your data, email {email ?? 'us'}.
            If you&apos;re unhappy with how we&apos;ve handled your data, you can complain to the
            Information Commissioner&apos;s Office at{' '}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className={link}>
              ico.org.uk
            </a>
            .
          </Text>
          <Text size="small" muted className="mt-8">
            Last updated {PRIVACY_UPDATED}.
          </Text>
        </section>
      </Container>
    </>
  );
}
