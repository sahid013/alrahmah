import type { ComponentType, SVGProps } from 'react';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from '@/components/icons';
import { siteConfig, type SocialLink } from '@/config/site';
import { cn } from '@/lib/utils/cn';

const icons: Record<SocialLink['platform'], ComponentType<SVGProps<SVGSVGElement>>> = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
};

/**
 * "Follow Us" dropdown: a compact card of social tiles (3 on the first row, the rest share the
 * second row), separated by hairlines. Anchored under its nav item; same fade as other menus.
 */
export function SocialsMenu({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  const socials = siteConfig.socials;
  const firstRow = Math.min(3, socials.length);

  return (
    <div
      id={id}
      className="animate-fade absolute top-full right-0 z-50 w-[36rem] max-w-[calc(100vw-2rem)] border border-neutral-200 bg-white"
    >
      <p className="border-b border-neutral-200 px-6 py-4 font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase">
        Stay connected with {siteConfig.name}
      </p>
      <ul className="grid grid-cols-6">
        {socials.map((social, i) => {
          const Icon = icons[social.platform];
          const inFirstRow = i < firstRow;
          // First row: equal thirds; second row: remaining tiles share the width.
          const span = inFirstRow
            ? firstRow === 3
              ? 'col-span-2'
              : firstRow === 2
                ? 'col-span-3'
                : 'col-span-6'
            : socials.length - firstRow === 1
              ? 'col-span-6'
              : socials.length - firstRow === 2
                ? 'col-span-3'
                : 'col-span-2';
          return (
            <li
              key={social.platform}
              className={cn(
                span,
                'border-neutral-200',
                // Hairline dividers between tiles.
                '[&:not(:nth-child(3)):not(:last-child)]:border-r',
                inFirstRow && 'border-b',
              )}
            >
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
