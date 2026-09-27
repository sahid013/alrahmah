import { cn } from '@/lib/utils/cn';

interface PatternCardProps {
  title: string;
  description: string;
  /** Heading level for the card title (defaults to h2). */
  as?: 'h2' | 'h3';
  className?: string;
}

/** Centred statement card: flat indigo with the faint star pattern, Forum title, light copy. */
export function PatternCard({ title, description, as: Title = 'h2', className }: PatternCardProps) {
  return (
    <article
      className={cn(
        'relative isolate flex h-full flex-col items-center justify-center overflow-hidden bg-primary-700 px-6 py-14 text-center sm:px-10 sm:py-16',
        className,
      )}
    >
      <div aria-hidden className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.07]" />
      <Title className="text-title-2xl text-white sm:text-title-3xl">{title}</Title>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-pretty text-primary-100">
        {description}
      </p>
    </article>
  );
}
