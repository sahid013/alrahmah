import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const alt = siteConfig.legalName;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** The full logo (for light backgrounds), centred at 60% of the image's width. */
const logoWidth = size.width * 0.6;
const logoHeight = Math.round((logoWidth * siteConfig.logo.height) / siteConfig.logo.width);
const logoSrc = `data:image/svg+xml;base64,${await readFile(
  join(process.cwd(), 'public', siteConfig.logo.src),
  'base64',
)}`;

/** Default social share image (pages without their own image, e.g. events use their poster). */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
      }}
    >
      <img src={logoSrc} width={logoWidth} height={logoHeight} alt="" />
    </div>,
    size,
  );
}
