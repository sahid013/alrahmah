'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { Fragment, useState, type FocusEvent } from 'react';
import { UpcomingEventsMobile } from '@/components/events/upcoming-events';
import { ArrowRightIcon, HeartIcon, PlusIcon, WhatsAppIcon } from '@/components/icons';
import { NextPrayerSection } from '@/components/prayer/next-prayer-section';
import { ButtonLink } from '@/components/ui/button';
import type { EventItem } from '@/lib/events';
import { cn } from '@/lib/utils/cn';
import type { HeroSlide } from './hero-slides';

/** How long the open slide stays before the next one opens (same rhythm as desktop). */
const SLIDE_DURATION_MS = 6500;
const ease = [0.22, 1, 0.36, 1] as const;

const ctaIcons = { whatsapp: WhatsAppIcon, heart: HeartIcon } as const;

/** Mobile CTA: 4px smaller text (12px) and icons than the desktop hero buttons. */
const mobileCta = 'h-11 px-5 text-xs';

/**
 * Mobile hero (below `lg`): an accordion. The open slide is a full image panel; the others are
 * rows with a "+". Tapping a row opens it (framer-motion height + fade) and the open slide
 * advances to the next after a delay, shown by a progress line. Reduced motion: no autoplay or
 * animation. Desktop uses `HeroSlideshow`.
 */
export function HeroMobile({ slides, events }: { slides: HeroSlide[]; events: EventItem[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const autoplay = !reduceMotion && !paused && slides.length > 1;

  // Keyboard focus inside the hero pauses autoplay (WCAG 2.2.2); taps don't.
  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target.matches(':focus-visible')) setPaused(true);
  };
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  };

  return (
    <section
      aria-label="Highlights"
      // Pulled up under the transparent header; the top padding adds the header height back.
      className="relative -mt-16 bg-primary-950 pt-16 text-white lg:hidden"
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <ul>
        {slides.map((slide, i) => {
          const open = i === index;
          const panelId = `hero-mobile-${slide.id}`;
          const Title = i === 0 ? 'h1' : 'h2';
          const CtaIcon = slide.primaryCta.icon ? ctaIcons[slide.primaryCta.icon] : null;

          return (
            <li key={slide.id} className="border-b border-white/10">
              {/* Collapsed row (kept for screen readers when open; the panel shows the title). */}
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setIndex(i)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secondary-400 sm:px-8',
                  open && 'sr-only',
                )}
              >
                <span className="font-label text-sm font-bold tracking-[0.15em] text-secondary-300 uppercase">
                  {slide.title.replace(/\n/g, ' ')}
                </span>
                <PlusIcon className="size-5 shrink-0 text-secondary-300" />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={panelId}
                    key="panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.6, ease }}
                    className="overflow-hidden"
                  >
                    <div className="relative isolate flex min-h-[62svh] flex-col items-center justify-center px-4 py-14 text-center sm:px-8">
                      {slide.background ? (
                        <Image
                          src={slide.background.src}
                          alt={slide.background.alt}
                          fill
                          priority={i === 0}
                          sizes="100vw"
                          className="-z-20 object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="bg-islamic-pattern absolute inset-0 -z-20 opacity-[0.06]"
                        />
                      )}
                      <div aria-hidden className="absolute inset-0 -z-10 bg-primary-950/70" />

                      <p className="font-label text-[0.7rem] font-bold tracking-[0.25em] text-secondary-300 uppercase">
                        {slide.eyebrow}
                      </p>
                      <Title className="mt-4 font-heading text-title-3xl leading-[1.05] font-normal tracking-heading text-balance text-white uppercase sm:text-title-4xl">
                        {slide.title.split('\n').map((line, l) => (
                          <Fragment key={l}>
                            {l > 0 && <br />}
                            {line}
                          </Fragment>
                        ))}
                      </Title>
                      <p className="mt-5 max-w-md text-base leading-relaxed text-balance text-primary-100">
                        {slide.body[0]}
                      </p>
                      <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <ButtonLink
                          href={slide.primaryCta.href}
                          variant="secondary"
                          className={mobileCta}
                        >
                          {CtaIcon && <CtaIcon className="size-4" />}
                          {slide.primaryCta.label}
                        </ButtonLink>
                        {slide.secondaryCta && (
                          <ButtonLink
                            href={slide.secondaryCta.href}
                            variant="outline-light"
                            className={mobileCta}
                          >
                            {slide.secondaryCta.label}
                            <ArrowRightIcon className="size-3.5" />
                          </ButtonLink>
                        )}
                      </div>

                      {/* Progress to the next slide; finishing it opens the next row. */}
                      {autoplay && (
                        <motion.span
                          key={`progress-${index}`}
                          aria-hidden
                          className="absolute bottom-0 left-0 h-0.5 bg-secondary-400"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: SLIDE_DURATION_MS / 1000, ease: 'linear' }}
                          onAnimationComplete={() => setIndex((index + 1) % slides.length)}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      <NextPrayerSection />
      <UpcomingEventsMobile events={events} />
    </section>
  );
}
