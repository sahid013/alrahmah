import { CookieSettingsButton } from '@/components/consent/cookie-settings-button';
import { buttonStyles } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { PageHero } from '@/components/ui/page-hero';
import { Heading, Text } from '@/components/ui/typography';
import { siteConfig } from '@/config/site';
import { cookieGroups } from '@/lib/consent/cookie-list';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Cookie Policy',
  description: `Which cookies the ${siteConfig.name} website uses, why, and how to change your choice.`,
  path: '/cookies',
});

const link = 'text-primary-500 underline underline-offset-4 hover:text-secondary-700';

export default function CookiesPage() {
  const { contact } = siteConfig;

  return (
    <>
      <PageHero eyebrow="Your privacy" title="Cookie Policy" />
      <Container className="max-w-4xl py-16 lg:py-24">
        <Text size="lead">
          Cookies are small files a website stores in your browser. This page lists every cookie and
          similar storage the {siteConfig.name} website uses ({siteConfig.legalName}, the charity
          that runs the masjid). Apart from the necessary ones, nothing is stored until you agree.
        </Text>
        <div className="mt-8">
          <CookieSettingsButton className={buttonStyles({ size: 'sm' })} />
        </div>

        {cookieGroups.map((group) => (
          <section key={group.title} aria-labelledby={`cookies-${group.title}`} className="mt-14">
            <Heading level={2} size={4} id={`cookies-${group.title}`}>
              {group.title}
            </Heading>
            <Text className="mt-3">
              {group.optional ? 'Optional. ' : 'Always on. '}
              {group.description}
            </Text>
            <div className="relative mt-6 overflow-x-auto border border-neutral-200">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-primary-50 font-label text-xs tracking-[0.12em] text-primary-900 uppercase">
                  <tr>
                    <th scope="col" className="p-3">
                      Name
                    </th>
                    <th scope="col" className="p-3">
                      Provider
                    </th>
                    <th scope="col" className="p-3">
                      Purpose
                    </th>
                    <th scope="col" className="p-3">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 align-top">
                  {group.entries.map((entry) => (
                    <tr key={entry.name}>
                      <td className="p-3 font-ui text-xs break-words text-primary-900">
                        {entry.name}
                      </td>
                      <td className="p-3">{entry.provider}</td>
                      <td className="p-3 leading-relaxed">{entry.purpose}</td>
                      <td className="p-3">{entry.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section aria-labelledby="cookies-more" className="mt-14">
          <Heading level={2} size={4} id="cookies-more">
            Changing your mind
          </Heading>
          <Text className="mt-3 max-w-3xl">
            Use &ldquo;Cookie settings&rdquo; at the bottom of any page to change your choice. We
            ask again every six months. You can also delete cookies in your browser settings. For
            the cookies Google and Stripe set, see{' '}
            <a
              href="https://policies.google.com/technologies/cookies"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              how Google uses cookies
            </a>{' '}
            and{' '}
            <a
              href="https://stripe.com/legal/cookies-policy"
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              Stripe&apos;s cookie policy
            </a>
            .
          </Text>
          {contact.email && (
            <Text className="mt-4 max-w-3xl">
              Questions? Email{' '}
              <a href={`mailto:${contact.email}`} className={link}>
                {contact.email}
              </a>
              .
            </Text>
          )}
          <Text size="small" muted className="mt-8">
            Last updated 17 October 2026.
          </Text>
        </section>
      </Container>
    </>
  );
}
