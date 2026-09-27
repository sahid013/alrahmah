import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

/** Embedded Google Map of the masjid with a directions link below. */
export function ContactMap() {
  const { contact } = siteConfig;
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-[22rem] flex-1 border border-neutral-200 bg-primary-50 lg:min-h-[32rem]">
        <iframe
          title={`Map showing ${siteConfig.name}, ${contact.addressLines.join(', ')}`}
          src={contact.mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 size-full"
        />
      </div>
      <ButtonLink
        href={contact.directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        variant="tertiary"
        className="mt-4 self-start"
      >
        Get directions
        <ArrowRightIcon />
      </ButtonLink>
    </div>
  );
}
