import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, HeartIcon, MosqueIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { footerNav } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { socialIcons } from './socials-menu';

const isExternal = (href: string) => /^https?:\/\//.test(href);

/** Footer link with the nav's grow-in underline on hover. */
function FooterLink({ label, href }: { label: string; href: string }) {
  const className =
    'relative inline-block py-1 text-primary-200 transition-colors duration-300 hover:text-white ' +
    'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-secondary-400 ' +
    'after:transition-transform after:duration-500 after:ease-(--ease-smooth) hover:after:scale-x-100 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-500';

  return isExternal(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

/**
 * Site footer, three bands on the deep indigo base:
 * 1. link columns (About · Services · Get Involved) beside a lighter contact panel;
 * 2. the logo and social channels, split by hairlines;
 * 3. the copyright line (padded at the bottom so the fixed prayer-times dock never covers it).
 */
export function Footer() {
  const { contact, socials } = siteConfig;

  return (
    <footer className="mt-auto bg-primary-950 text-primary-100">
      <Container className="grid gap-12 pt-16 sm:grid-cols-2 sm:pt-20 lg:grid-cols-3 lg:gap-8 xl:grid-cols-[1fr_1fr_1fr_minmax(18rem,24rem)] xl:pb-20">
        {footerNav.map((column) => (
          <nav key={column.title} aria-labelledby={`footer-${column.title}`}>
            <h2 id={`footer-${column.title}`} className="text-title-xl leading-none text-white">
              {column.title}
            </h2>
            <span aria-hidden className="mt-4 block h-0.5 w-8 bg-secondary-500" />
            <ul className="mt-6 space-y-2 text-base">
              {column.links.map((link) => (
                <li key={link.href}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Contact panel: a lighter full-width band below the links; a side column running to the edge on wide screens. */}
        <address className="-mx-4 bg-primary-900 px-4 py-10 not-italic sm:col-span-2 sm:-mx-8 sm:px-8 lg:col-span-3 lg:-mx-16 lg:px-16 xl:col-span-1 xl:-my-20 xl:mr-[-4rem] xl:ml-0 xl:px-12 xl:py-20">
          <MosqueIcon className="h-10 w-auto text-secondary-300" />
          <p className="mt-6 text-lg leading-relaxed text-white">
            {siteConfig.legalName}
            {contact.addressLines.map((line) => (
              <span key={line} className="block text-primary-200">
                {line}
              </span>
            ))}
          </p>
          {(contact.phone || contact.email) && (
            <p className="mt-4 space-y-1 text-primary-200">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="block hover:text-white"
                >
                  {contact.phone}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="block hover:text-white">
                  {contact.email}
                </a>
              )}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/contact" variant="secondary" size="sm">
              Contact us
              <ArrowRightIcon className="size-3.5" />
            </ButtonLink>
            <ButtonLink href={siteConfig.links.donate} variant="outline-light" size="sm">
              <HeartIcon className="size-3.5" />
              Donate
            </ButtonLink>
          </div>
        </address>
      </Container>

      {/* Logo · social channels. */}
      <div className="border-y border-white/10">
        <Container className="flex flex-col items-start gap-8 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-8">
          <Link
            href="/"
            aria-label={`${siteConfig.name} — home`}
            className="transition-opacity duration-300 hover:opacity-80"
          >
            <Image
              src={siteConfig.logoLight}
              alt={siteConfig.legalName}
              width={siteConfig.logo.width}
              height={siteConfig.logo.height}
              className="h-12 w-auto lg:h-14"
            />
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase">
              Stay connected
            </p>
            <ul className="flex border border-white/10">
              {socials.map((social) => {
                const Icon = socialIcons[social.platform];
                return (
                  <li key={social.platform} className="border-white/10 not-last:border-r">
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${siteConfig.name} on ${social.name} (opens in a new tab)`}
                      className="flex size-12 items-center justify-center text-primary-200 transition-colors duration-300 hover:bg-primary-900 hover:text-secondary-300 focus-visible:bg-primary-900 focus-visible:outline-none sm:size-14"
                    >
                      <Icon className="size-5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </Container>
      </div>

      <Container className="flex flex-col gap-2 pt-6 pb-28 font-label text-xs tracking-[0.12em] text-primary-300 uppercase sm:pb-32 lg:flex-row lg:gap-6 lg:pb-8">
        <p>
          © {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.
        </p>
        <p>
          Serving {siteConfig.address.locality} since {siteConfig.foundingYear}
        </p>
      </Container>
    </footer>
  );
}
