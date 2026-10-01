import Image from 'next/image';
import { donatePanel as content } from '@/lib/giving/content';

/**
 * Left-hand panel of the donation page: photo under a flat navy overlay, short fixed copy.
 * On phones it follows the form (visual order only), so donors reach the form first.
 */
export function DonatePanel() {
  const { contact } = content;
  return (
    <div className="relative isolate order-last overflow-hidden px-4 py-12 text-white sm:px-8 lg:order-none lg:px-16 lg:py-24">
      <Image
        src={encodeURI(content.background.src)}
        alt={content.background.alt}
        fill
        sizes="(min-width: 1024px) 42vw, 100vw"
        className="-z-20 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-primary-950/85" />

      <div className="mx-auto max-w-md lg:sticky lg:top-44">
        <h1 className="text-title-3xl leading-none text-white sm:text-title-4xl">
          {content.title}
        </h1>

        <div className="mt-8 space-y-4 text-primary-100 lg:mt-10">
          <p className="font-label text-sm font-bold tracking-[0.15em] text-secondary-300 uppercase">
            {content.heading}
          </p>
          {content.paragraphs.map((p) => (
            <p key={p} className="leading-relaxed">
              {p}
            </p>
          ))}
          {(contact.email || contact.phone) && (
            <p className="leading-relaxed">
              Questions?{' '}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="text-white underline-offset-4 hover:underline"
                >
                  {contact.email}
                </a>
              )}
              {contact.email && contact.phone && ' · '}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                  className="font-ui whitespace-nowrap text-white underline-offset-4 hover:underline"
                >
                  {contact.phone}
                </a>
              )}
            </p>
          )}
        </div>

        <p className="mt-8 font-script text-3xl text-secondary-300">{content.closing}</p>
      </div>
    </div>
  );
}
