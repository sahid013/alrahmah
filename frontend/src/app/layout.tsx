import type { Metadata, Viewport } from 'next';
import { Amiri, Forum, Poppins, PT_Sans_Narrow, Sacramento } from 'next/font/google';
import localFont from 'next/font/local';
import { JsonLd } from '@/components/seo/json-ld';
import { env } from '@/config/env';
import { siteConfig } from '@/config/site';
import { gtmHeadScript, gtmNoscriptSrc } from '@/lib/consent/gtm';
import { siteJsonLd } from '@/lib/structured-data';
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

/**
 * Shared HTML shell (fonts, metadata, structured data, Google Tag Manager with Consent Mode
 * defaults first). Site and dashboard add their own chrome.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  const { gtmId } = env;
  return (
    <html
      lang="en"
      className={`${glacial.variable} ${forum.variable} ${poppins.variable} ${ptSansNarrow.variable} ${sacramento.variable} ${amiri.variable} h-full antialiased`}
    >
      <head>{gtmId && <script dangerouslySetInnerHTML={{ __html: gtmHeadScript(gtmId) }} />}</head>
      <body className="flex min-h-full flex-col">
        {gtmId && (
          <noscript>
            <iframe
              src={gtmNoscriptSrc(gtmId)}
              title="Google Tag Manager"
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <JsonLd data={siteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
