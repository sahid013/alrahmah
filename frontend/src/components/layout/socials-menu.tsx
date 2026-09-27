import type { ComponentType, SVGProps } from 'react';
import { FacebookIcon, InstagramIcon, WhatsAppIcon, YouTubeIcon } from '@/components/icons';
import { siteConfig, type SocialLink } from '@/config/site';

export const socialIcons: Record<SocialLink['platform'], ComponentType<SVGProps<SVGSVGElement>>> = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
};

/**
 * "Al Rahmah Network" dropdown: a compact card of social tiles in a 2-column grid, separated by
 * hairlines. Anchored under its nav item; same fade as other menus.
 */
export function SocialsMenu({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  const socials = siteConfig.socials;

  return (
    <div
      id={id}
      className="animate-fade absolute top-full right-0 z-50 w-[28rem] max-w-[calc(100vw-2rem)] overflow-hidden border border-neutral-200 bg-white"
    >
      <p className="border-b border-neutral-200 px-6 py-4 font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase">
        Stay connected with {siteConfig.name}
      </p>
      {/* Hairlines: every tile has right/bottom borders; the list overlaps the card edge by 1px. */}
      <ul className="-mr-px -mb-px grid grid-cols-2">
        {socials.map((social) => {
          const Icon = socialIcons[social.platform];
          return (
            <li key={social.platform} className="border-r border-b border-neutral-200">
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onNavigate}
                aria-label={`${siteConfig.name} on ${social.name} (opens in a new tab)`}
                className="group/social flex h-full flex-col items-center justify-center gap-3 px-4 py-8 text-center transition-colors duration-300 hover:bg-primary-50 focus-visible:bg-primary-50 focus-visible:outline-none"
              >
                <Icon className="size-9 text-primary-500 transition-colors duration-300 group-hover/social:text-secondary-600" />
                <span className="font-heading text-title-base leading-none tracking-heading text-primary-900 uppercase">
                  {social.name}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
