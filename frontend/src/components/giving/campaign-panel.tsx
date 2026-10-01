import Image from 'next/image';
import { DonationTracker } from '@/components/donations/donation-tracker';
import type { DonationProgram } from '@/lib/donations/types';

const PROMISES = [
  'Secure card payments by Stripe. We never see your card number.',
  'Gift Aid adds 25% to your donation if you are a UK taxpayer.',
  'Cancel regular giving at any time.',
];

/** Left-hand panel: the campaign being supported. */
export function CampaignPanel({ program }: { program?: DonationProgram }) {
  return (
    <div className="relative isolate h-full overflow-hidden bg-primary-900 px-4 py-10 text-white sm:px-8 lg:px-16 lg:py-16">
      <div aria-hidden className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.06]" />
      <div className="mx-auto max-w-md lg:sticky lg:top-40">
        <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-300 uppercase sm:text-sm">
          You are donating to
        </p>
        <h1 className="mt-3 text-title-3xl leading-none text-white sm:text-title-4xl">
          {program?.title ?? 'Al-Rahmah Masjid'}
        </h1>
        {program && (
          <div className="relative mt-8 hidden aspect-square w-full max-w-sm overflow-hidden border border-white/10 bg-primary-800 sm:block">
            <Image
              src={program.image.src}
              alt={program.image.alt}
              fill
              sizes="24rem"
              className="object-cover"
            />
          </div>
        )}
        {program?.summary && (
          <p className="mt-6 text-lg leading-relaxed text-primary-100">{program.summary}</p>
        )}
        {program?.tracker && (
          <DonationTracker tracker={program.tracker} tone="dark" className="mt-6" />
        )}
        <ul className="mt-8 hidden space-y-3 border-t border-white/10 pt-6 text-primary-100 lg:block">
          {PROMISES.map((p) => (
            <li key={p} className="flex gap-3">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-secondary-400" />
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-8 hidden font-label text-sm font-bold tracking-[0.12em] text-secondary-300 uppercase lg:block">
          Jazakum Allahu khairan
        </p>
      </div>
    </div>
  );
}
