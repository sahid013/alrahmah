'use client';

import Image from 'next/image';
import { useRef, useState, type CSSProperties, type FocusEvent, type TouchEvent } from 'react';
import { UpcomingEvents } from '@/components/events/upcoming-events';
import { ArrowRightIcon, HeartIcon, WhatsAppIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import type { EventItem } from '@/lib/events';
import { cn } from '@/lib/utils/cn';
import type { HeroSlide } from './hero-slides';

/** How long each slide stays before advancing (drives the tracker's progress ring). */
const SLIDE_DURATION_MS = 6500;
/** Minimum horizontal swipe distance (px) to change slide on touch screens. */
const SWIPE_THRESHOLD = 50;

const ctaIcons = { whatsapp: WhatsAppIcon, heart: HeartIcon } as const;

/** Position of an element in the entrance sequence (see `.hero-slide` in globals.css). */
const step = (i: number) => ({ '--i': i }) as CSSProperties;

/**
 * Slide tracker: a dot per slide with its label. The active dot has a circular progress line
 * that fills over the slide's duration — its `animationend` advances the slideshow, so the
 * ring and the slide change can never drift apart. Pausing pauses the ring.
 */
function SlideTracker({
  slides,
  index,
  paused,
  onSelect,
  onComplete,
}: {
  slides: HeroSlide[];
  index: number;
  paused: boolean;
  onSelect: (i: number) => void;
  onComplete: () => void;
}) {
  return (
    <ol aria-label="Slides" className="flex flex-wrap gap-x-8 gap-y-4 lg:flex-col lg:gap-5">
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <li key={slide.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              aria-current={active ? 'true' : undefined}
              aria-label={`Show slide ${i + 1}: ${slide.label}`}
              className={cn(
                'group flex items-center gap-3 text-left font-label text-xs font-bold tracking-[0.2em] uppercase transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary-400 sm:text-sm',
                active ? 'text-secondary-300' : 'text-white/60 hover:text-white',
              )}
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0 -rotate-90">
                {/* Track */}
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={active ? 0.3 : 0.6}
                  strokeWidth="1.5"
                />
                {active && (
                  <>
                    <circle
                      key={index}
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      pathLength={1}
                      className="hero-ring"
                      data-paused={paused}
                      onAnimationEnd={onComplete}
                    />
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                  </>
                )}
              </svg>
              {slide.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function HeroSlideshow({ slides, events }: { slides: HeroSlide[]; events: EventItem[] }) {
  const [index, setIndex] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = (i: number) => {
    setAdvanced(true);
    setIndex(((i % slides.length) + slides.length) % slides.length);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

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
      style={{ '--slide-duration': `${SLIDE_DURATION_MS}ms` } as CSSProperties}
      // Pulled up under the transparent header; top padding adds the header height back.
      className="relative isolate -mt-16 flex min-h-[95svh] flex-col overflow-hidden bg-primary-950 text-white lg:-mt-[8.5rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={onBlur}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Backgrounds: one full-bleed photo per slide, crossfading. */}
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== index}
          data-active={i === index}
          className="hero-slide hero-bg absolute inset-0 -z-20"
        >
          <div className="hero-drift absolute inset-0">
            <Image
              src={slide.background.src}
              alt={slide.background.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      ))}
      {/* Dark scrim: 100% on the left fading to 0% on the right (keeps text legible). */}
      <div aria-hidden className="hero-scrim absolute inset-0 -z-10" />

      <Container className="relative flex flex-1 flex-col pt-[calc(4rem+2.5rem)] sm:pt-[calc(4rem+4rem)] lg:pt-[calc(8.5rem+2rem)]">
        {/* Slide content, stacked in one grid cell so the hero keeps the tallest slide's height. */}
        <div className="grid flex-1 items-center pb-10 lg:pb-12">
          {slides.map((slide, i) => {
            const active = i === index;
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
                className="hero-slide col-start-1 row-start-1 max-w-4xl"
              >
                <p
                  className="hero-from-left font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm"
                  style={step(0)}
                >
                  {slide.eyebrow}
                </p>
                <Title
                  className="hero-from-left mt-6 font-heading text-title-4xl leading-[1.05] font-normal tracking-heading text-white uppercase sm:text-title-5xl xl:text-title-6xl"
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
            );
          })}
        </div>

        {/* Tracker: under the content on small screens; right side, mid-height on desktop. */}
        <div className="pb-10 lg:absolute lg:top-1/2 lg:right-16 lg:-translate-y-1/2 lg:pb-0">
          <SlideTracker
            slides={slides}
            index={index}
            paused={paused}
            onSelect={goTo}
            onComplete={next}
          />
        </div>
      </Container>

      {/* Upcoming events: solid panel anchored to the bottom-right edge on wide screens (xl+);
          below that it sits under the content so it never covers the buttons. */}
      <UpcomingEvents
        events={events}
        className="xl:absolute xl:right-0 xl:bottom-0 xl:w-[46%] 2xl:w-[52%]"
      />
    </section>
  );
}
