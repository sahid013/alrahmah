import { ArrowRightIcon, WhatsAppIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { siteConfig } from '@/config/site';

/**
 * Calls to action shown above the footer on every page: two panels (volunteer, feedback) and
 * a stay-updated bar. Panels are full-bleed halves; content aligns to the site gutter.
 */
export function PreFooter() {
  return (
    <section aria-label="Get involved" className="text-white">
      <div className="grid lg:grid-cols-2">
        <div className="bg-primary-800">
          <div className="px-4 py-14 sm:px-8 lg:py-16 lg:pr-12 lg:pl-16 xl:ml-auto xl:max-w-[48rem]">
            <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
              Become a volunteer today
            </p>
            <h2 className="mt-3 text-title-2xl leading-tight text-white sm:text-title-3xl">
              Join the Al-Rahmah family
            </h2>
            <ButtonLink href="/volunteering" variant="secondary" size="sm" className="mt-8">
              Learn more
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>
        </div>
        <div className="bg-primary-700">
          <div className="px-4 py-14 sm:px-8 lg:py-16 lg:pr-16 lg:pl-12 xl:mr-auto xl:max-w-[48rem]">
            <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
              Give your feedback
            </p>
            <h2 className="mt-3 text-title-2xl leading-tight text-white sm:text-title-3xl">
              We would love to hear from you
            </h2>
            <ButtonLink href="/contact" variant="secondary" size="sm" className="mt-8">
              Contact us
              <ArrowRightIcon className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-primary-900">
        <Container className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-lg text-primary-100">
            Stay up to date with the latest events, courses and news from {siteConfig.name}.
          </p>
          <ButtonLink
            href={siteConfig.links.whatsappChannel}
            variant="white"
            size="sm"
            className="shrink-0"
          >
            <WhatsAppIcon className="size-4" />
            Join our WhatsApp channel
          </ButtonLink>
        </Container>
      </div>
    </section>
  );
}
