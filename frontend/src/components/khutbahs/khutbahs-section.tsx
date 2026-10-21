import { YouTubeIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { siteConfig } from '@/config/site';
import type { Khutbah } from '@/lib/khutbahs/youtube';

const { khutbahPlaylistId } = siteConfig.youtube;
const playlistUrl = `https://www.youtube.com/playlist?list=${khutbahPlaylistId}`;

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/London',
});

function KhutbahDate({ khutbah }: { khutbah: Khutbah }) {
  return (
    <time dateTime={khutbah.publishedAt} className="font-ui text-sm text-secondary-700">
      {dateFormat.format(new Date(khutbah.publishedAt))}
    </time>
  );
}

/**
 * Home-page "Latest Khutbahs" (after Services): text on the left, this week's khutbah playing in
 * an embedded player on the right. Updates on its own as the masjid adds videos to the playlist.
 * With `khutbahs` (YouTube API), the left column names this week's khutbah and lists the two
 * before it; with `null` (no key or API error) the player shows the playlist, which also always
 * opens on the newest khutbah.
 */
export function KhutbahsSection({ khutbahs }: { khutbahs: Khutbah[] | null }) {
  const [latest, ...earlier] = khutbahs ?? [];
  const embedSrc = latest
    ? `https://www.youtube-nocookie.com/embed/${latest.id}?list=${khutbahPlaylistId}`
    : `https://www.youtube-nocookie.com/embed/videoseries?list=${khutbahPlaylistId}`;

  return (
    <section aria-labelledby="khutbahs-title" className="bg-primary-50 py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
        {/* Left: intro, this week's khutbah, earlier ones and the playlist link. */}
        <div>
          <Reveal>
            <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase sm:text-sm">
              Every Friday
            </p>
            <h2 id="khutbahs-title" className="mt-4 text-title-3xl sm:text-title-4xl">
              Latest Khutbahs
            </h2>
            <span aria-hidden className="mt-6 block h-1 w-16 bg-secondary-500" />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-neutral-600">
              Missed Jumu&apos;ah, or want to listen again? Watch this week&apos;s khutbah here, and
              past sermons on our YouTube channel.
            </p>
          </Reveal>

          {latest && (
            <Reveal order={1} className="mt-8">
              <p className="font-label text-xs font-bold tracking-[0.2em] text-primary-400 uppercase">
                This week
              </p>
              <p className="mt-2 text-title-lg tracking-heading text-primary-500 uppercase sm:text-title-xl">
                {latest.title}
              </p>
              <p className="mt-1 text-neutral-600">
                {latest.speaker && <>{latest.speaker} · </>}
                <KhutbahDate khutbah={latest} />
              </p>
            </Reveal>
          )}

          {earlier.length > 0 && (
            <Reveal order={2} className="mt-8">
              <p className="font-label text-xs font-bold tracking-[0.2em] text-primary-400 uppercase">
                Previous weeks
              </p>
              <ul className="mt-2 divide-y divide-primary-100 border-y border-primary-100">
                {earlier.map((khutbah) => (
                  <li key={khutbah.id}>
                    <a
                      href={khutbah.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-baseline justify-between gap-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500"
                    >
                      <span className="font-heading text-title-sm tracking-[0.05em] text-primary-500 uppercase transition-colors duration-300 group-hover:text-secondary-700">
                        {khutbah.title}
                        <span className="sr-only"> (opens YouTube in a new tab)</span>
                      </span>
                      <span className="shrink-0">
                        <KhutbahDate khutbah={khutbah} />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          <Reveal order={3} className="mt-10">
            <ButtonLink href={playlistUrl} target="_blank" rel="noopener noreferrer" size="md">
              <YouTubeIcon className="size-5" />
              All khutbahs
              <span className="sr-only"> (opens YouTube in a new tab)</span>
            </ButtonLink>
          </Reveal>
        </div>

        {/* Right: the player (privacy-enhanced youtube-nocookie.com, loads when scrolled near). Shown
            without asking for external-media consent (client request); listed on /cookies. */}
        <Reveal order={1}>
          <div className="relative aspect-video border border-primary-100 bg-primary-900">
            <iframe
              src={embedSrc}
              title={
                latest
                  ? `${latest.title} — khutbah video (YouTube)`
                  : 'Latest khutbah from Al-Rahmah Masjid (YouTube)'
              }
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
