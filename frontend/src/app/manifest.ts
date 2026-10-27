import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

/**
 * Web app manifest: the name and icons used when the site is added to a phone's home screen.
 * Icons are the logo's emblem (`public/brand/logo-mark.svg`) on white; the maskable one has extra
 * space so Android's round/squircle crop never cuts it. Browser tab icons are `app/icon.svg`
 * (switches to white on dark tabs), `app/favicon.ico` and `app/apple-icon.png`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: 'Al-Rahmah',
    description: siteConfig.description,
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#363287',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
