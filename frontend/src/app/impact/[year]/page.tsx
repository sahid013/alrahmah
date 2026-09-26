import { notFound } from 'next/navigation';
import { ArrowRightIcon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Heading, Text } from '@/components/ui/typography';
import { impactReport } from '@/lib/impact/data';
import { buildMetadata } from '@/lib/seo';

/** Only published report years exist. */
export const dynamicParams = false;
export const generateStaticParams = () => [{ year: String(impactReport.year) }];

type Props = { params: Promise<{ year: string }> };

export async function generateMetadata({ params }: Props) {
  const { year } = await params;
  return buildMetadata({
    title: `${year} Impact Report`,
    description: impactReport.intro,
    path: `/impact/${year}`,
    // TODO: remove once the real report is published.
    noindex: true,
  });
}

/** Placeholder until the full report (PDF or page) is published. */
export default async function ImpactReportPage({ params }: Props) {
  const { year } = await params;
  if (year !== String(impactReport.year)) notFound();

  return (
    <Container className="py-16 lg:py-24">
      <ButtonLink href="/" variant="tertiary" size="xs">
        <ArrowRightIcon className="size-3.5 rotate-180" />
        Back to home
      </ButtonLink>
      <Heading level={1} className="mt-8">
        {year} Impact Report
      </Heading>
      <Text size="lead" className="mt-6 max-w-2xl">
        {impactReport.intro}
      </Text>
      <Text className="mt-6 max-w-2xl border-l-2 border-secondary-500 bg-secondary-50 p-4">
        The full {year} report will be published here soon.
      </Text>
    </Container>
  );
}
