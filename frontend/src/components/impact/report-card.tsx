import Image from 'next/image';
import { DownloadIcon } from '@/components/icons';
import { buttonStyles } from '@/components/ui/button';
import { Reveal } from '@/components/ui/reveal';
import type { PublishedReport } from '@/lib/impact/reports';
import { cn } from '@/lib/utils/cn';

/** One published report: its first page as the preview, beside the title and a PDF download. */
export function ReportCard({ report }: { report: PublishedReport }) {
  const headingId = `${report.id}-title`;
  return (
    <article
      id={report.id}
      aria-labelledby={headingId}
      className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-12 lg:gap-16"
    >
      <Reveal className="lg:col-span-7">
        <a
          href={report.pdf.href}
          target="_blank"
          rel="noopener"
          className="block border border-neutral-200 bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-500"
        >
          <Image
            src={report.cover.src}
            alt={report.cover.alt}
            width={report.cover.width}
            height={report.cover.height}
            sizes="(min-width: 1024px) 55vw, 100vw"
            preload
            className="h-auto w-full"
          />
          <span className="sr-only">(opens the PDF in a new tab)</span>
        </a>
      </Reveal>
      <div className="lg:col-span-5">
        <Reveal order={1}>
          <p className="font-label text-xs font-bold tracking-[0.3em] text-secondary-700 uppercase sm:text-sm">
            {report.year}
          </p>
          <h2 id={headingId} className="mt-3 text-title-3xl leading-none sm:text-title-4xl">
            {report.title}
          </h2>
          <span aria-hidden className="mt-6 block h-0.5 w-10 bg-secondary-500" />
        </Reveal>
        <Reveal order={2}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-neutral-600">
            {report.summary}
          </p>
        </Reveal>
        <Reveal order={3}>
          <a
            href={report.pdf.href}
            download={report.pdf.fileName}
            className={cn(buttonStyles({ variant: 'primary' }), 'mt-8')}
          >
            <DownloadIcon className="size-5" />
            Download PDF
          </a>
        </Reveal>
      </div>
    </article>
  );
}
