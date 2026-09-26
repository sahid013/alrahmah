import { ImageResponse } from 'next/og';
import { siteConfig } from '@/config/site';

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default social share image. Replace with a designed image by adding `opengraph-image.png`. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: '#363287',
        borderBottom: '24px solid #25A6DE',
        color: 'white',
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700 }}>{siteConfig.name}</div>
      <div style={{ fontSize: 36, marginTop: 24, opacity: 0.9 }}>{siteConfig.description}</div>
    </div>,
    size,
  );
}
