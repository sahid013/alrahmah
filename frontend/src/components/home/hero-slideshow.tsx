'use client';

import { useRef, type CSSProperties, type FocusEvent, type TouchEvent } from 'react';
import { ArrowRightIcon, HeartIcon, WhatsAppIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { useSlideshow } from '@/lib/hooks/use-slideshow';
import { UpcomingEvents } from '@/components/events/upcoming-events';
import type { EventItem } from '@/lib/events';
import type { HeroSlide } from './hero-slides';
import { AppealVisual, WelcomeVisual } from './hero-visuals';

/** How long each slide stays before advancing. */
const SLIDE_DURATION_MS = 4500;
/** Minimum horizontal swipe distance (px) to change slide on touch screens. */
const SWIPE_THRESHOLD = 50;

const visuals = { welcome: WelcomeVisual, appeal: AppealVisual } as const;
const ctaIcons = { whatsapp: WhatsAppIcon, heart: HeartIcon } as const;

/** Position of an element in the entrance sequence (see `.hero-slide` in globals.css). */
const step = (i: number) => ({ '--i': i }) as CSSProperties;

export function HeroSlideshow({ slides, events }: { slides: HeroSlide[]; events: EventItem[] }) {
  const { index, advanced, next, prev, setPaused } = useSlideshow({
    count: slides.length,
    interval: SLIDE_DURATION_MS,
  });
  const touchStartX = useRef<number | null>(null);
  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
  };
  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start === null || end === undefined) return;
    const dx = end - start;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) next();
    else prev();
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Highlights"
      data-advanced={advanced}
      // Pulled up under the transparent header; top padding adds the header height back.
      className="relative isolate -mt-16 overflow-hidden bg-primary-900 text-white lg:-mt-[4.5rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={onBlur}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Container className="flex flex-col pt-[calc(4rem+2.5rem)] sm:pt-[calc(4rem+4rem)] lg:min-h-svh lg:pt-[calc(4.5rem+3rem)]">
        {/* Slides are stacked in one grid cell so the hero keeps the tallest slide's height. */}
        <div className="grid flex-1 items-center">
          {slides.map((slide, i) => {
            const active = i === index;
            const Visual = visuals[slide.visual];
            const CtaIcon = slide.primaryCta.icon ? ctaIcons[slide.primaryCta.icon] : null;
            const Title = i === 0 ? 'h1' : 'h2';

            return (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}: ${slide.label}`}
                data-active={active}
                inert={!active}
                className="hero-slide col-start-1 row-start-1 grid items-center gap-12 lg:grid-cols-12 lg:gap-16"
              >
                <div className="lg:col-span-7">
                  <p
                    className="hero-from-left font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm"
                    style={step(0)}
                  >
                    {slide.eyebrow}
                  </p>
                  <Title
                    className="hero-from-left mt-6 font-heading text-title-4xl leading-[1.1] font-normal tracking-heading text-white uppercase sm:text-title-5xl xl:text-title-6xl"
                    style={step(1)}
                  >
                    {slide.title}
                  </Title>
                  <div className="mt-8 max-w-xl space-y-4">
                    {slide.body.map((paragraph, p) => (
                      <p
                        key={paragraph}
                        className="hero-from-left text-lg leading-relaxed text-balance text-primary-100 sm:text-xl"
                        style={step(2 + p)}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {slide.note && (
                    <p
                      className="hero-from-left mt-6 max-w-xl border-l-2 border-secondary-400 pl-4 text-base text-primary-200"
                      style={step(2 + slide.body.length)}
                    >
                      {slide.note}
                    </p>
                  )}
                  <div
                    className="hero-from-left mt-10 flex flex-wrap gap-4"
                    style={step(3 + slide.body.length)}
                  >
                    <ButtonLink href={slide.primaryCta.href} variant="secondary" size="lg">
                      {CtaIcon && <CtaIcon />}
                      {slide.primaryCta.label}
                    </ButtonLink>
                    {slide.secondaryCta && (
                      <ButtonLink href={slide.secondaryCta.href} variant="outline-light" size="lg">
                        {slide.secondaryCta.label}
                        <ArrowRightIcon />
                      </ButtonLink>
                    )}
                  </div>
                </div>
                <div className="hero-from-right hidden sm:block lg:col-span-5" style={step(1)}>
                  <Visual />
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming events: left half on desktop (clear of the fixed prayer-time card), two at a time. */}
        <UpcomingEvents
          events={events}
          className="mt-12 pb-24 sm:pb-28 lg:mt-14 lg:w-1/2 lg:pb-12"
        />
      </Container>
    </section>
  );
}
