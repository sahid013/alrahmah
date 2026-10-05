import type { Metadata, Viewport } from 'next';
import { Amiri, Forum, Poppins, PT_Sans_Narrow, Sacramento } from 'next/font/google';
import localFont from 'next/font/local';
import { JsonLd } from '@/components/seo/json-ld';
import { siteConfig } from '@/config/site';
import './globals.css';

/** Titles. */
const forum = Forum({
  variable: '--font-forum',
  subsets: ['latin'],
  weight: '400',
});

/** Numbers and interface labels. */
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

/** Descriptions, body, buttons, nav and labels. Glacial Indifference (SIL OFL), self-hosted. */
const glacial = localFont({
  variable: '--font-glacial',
  src: [
    {
      path: './fonts/glacial-indifference/glacial-indifference-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/glacial-indifference/glacial-indifference-400italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/glacial-indifference/glacial-indifference-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
});

/** Script accent (e.g. "Peace Be Upon You"). */
const sacramento = Sacramento({
  variable: '--font-sacramento',
  subsets: ['latin'],
  weight: '400',
});

/** Arabic text (e.g. the greeting "السلام عليكم"); the title font has no Arabic glyphs. */
const amiri = Amiri({
  variable: '--font-amiri',
  subsets: ['arabic'],
  weight: ['400', '700'],
});

/** Campaign lockups only. */
const ptSansNarrow = PT_Sans_Narrow({
  variable: '--font-pt-sans-narrow',
  subsets: ['latin'],
  weight: ['700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#363287',
};

/** Shared HTML shell (fonts, metadata, structured data). Site and dashboard add their own chrome. */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${glacial.variable} ${forum.variable} ${poppins.variable} ${ptSansNarrow.variable} ${sacramento.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Mosque',
            name: siteConfig.name,
            alternateName: siteConfig.legalName,
            description: siteConfig.description,
            url: siteConfig.url,
            logo: `${siteConfig.url}${siteConfig.logo.src}`,
            foundingDate: String(siteConfig.foundingYear),
            telephone: siteConfig.contact.phone,
            email: siteConfig.contact.email,
            address: {
              '@type': 'PostalAddress',
              streetAddress: siteConfig.address.street,
              postalCode: siteConfig.address.postalCode,
              addressLocality: siteConfig.address.locality,
              addressCountry: siteConfig.address.country,
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
