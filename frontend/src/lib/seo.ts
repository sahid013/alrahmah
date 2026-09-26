import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

interface PageSeo {
  title: string;
  description?: string;
  /** Path of the page, e.g. `/about`. Used for the canonical URL. */
  path: string;
  image?: string;
  noindex?: boolean;
}

/** Builds consistent per-page metadata: title, description, canonical, Open Graph, Twitter. */
export const buildMetadata = ({ title, description, path, image, noindex }: PageSeo): Metadata => {
  const pageDescription = description ?? siteConfig.description;
  // Falls back to the generated `app/opengraph-image.tsx`.
  const images = [image ?? '/opengraph-image'];

  return {
    title,
    description: pageDescription,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: pageDescription,
      url: path,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: 'website',
      images,
    },
    twitter: { card: 'summary_large_image', title, description: pageDescription, images },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
};
