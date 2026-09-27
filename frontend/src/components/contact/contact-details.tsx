import type { ComponentType, ReactNode, SVGProps } from 'react';
import { MailIcon, MapPinIcon, PhoneIcon } from '@/components/icons';
import { socialIcons } from '@/components/layout/socials-menu';
import { siteConfig } from '@/config/site';

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center bg-primary-50 text-primary-500">
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col">
        <span className="font-label text-xs font-bold tracking-[0.2em] text-secondary-700 uppercase">
          {label}
        </span>
        <span className="mt-1 text-lg text-primary-900">{children}</span>
      </span>
    </li>
  );
}

/** Email, address and phone with square icon tiles, then the social channels. */
export function ContactDetails() {
  const { contact, socials } = siteConfig;

  return (
    <div>
      <address className="not-italic">
        <ul className="space-y-6">
          {contact.email && (
            <DetailRow icon={MailIcon} label="Email">
              <a
                href={`mailto:${contact.email}`}
                className="text-primary-900 transition-colors duration-300 hover:text-secondary-700"
              >
                {contact.email}
              </a>
            </DetailRow>
          )}
          <DetailRow icon={MapPinIcon} label="Address">
            {contact.addressLines.join(', ')}
          </DetailRow>
          {contact.phone && (
            <DetailRow icon={PhoneIcon} label="Phone">
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="font-ui text-primary-900 tabular-nums transition-colors duration-300 hover:text-secondary-700"
              >
                {contact.phone}
              </a>
            </DetailRow>
          )}
        </ul>
      </address>

      <ul className="mt-8 flex flex-wrap gap-2" aria-label="Follow us">
        {socials.map((social) => {
          const Icon = socialIcons[social.platform];
          return (
            <li key={social.platform}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${social.name} (opens in a new tab)`}
                className="flex size-11 items-center justify-center border border-neutral-200 text-primary-500 transition-colors duration-300 hover:border-secondary-500 hover:bg-secondary-500 hover:text-primary-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500"
              >
                <Icon className="size-5" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
