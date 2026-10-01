import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = { 'aria-hidden': true, focusable: false } as const;

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" {...base} {...props}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.43-9.43a9.37 9.37 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.71C5.8.71.7 5.8.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.62l6.03-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.32-8.02" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" {...base} {...props}>
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.9 4.5 6.7 4.1c2-.2 3.9.8 5.3 2.5 1.4-1.7 3.3-2.7 5.3-2.5 3.8.4 5.8 4.3 4.3 7.7C19.5 16.4 12 21 12 21Z" />
    </svg>
  );
}

export function ChevronIcon({
  direction = 'right',
  ...props
}: IconProps & { direction?: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      {...base}
      {...props}
    >
      <path d={direction === 'right' ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} />
    </svg>
  );
}

export function MenuIcon({ open, ...props }: IconProps & { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      width="24"
      height="24"
      {...base}
      {...props}
    >
      {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      width="18"
      height="18"
      {...base}
      {...props}
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

/** Line-drawn mosque (dome + minaret), square caps to match the flat style. */
export function MosqueIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      width="64"
      height="56"
      {...base}
      {...props}
    >
      {/* Minaret */}
      <path d="M6 54V14l5-8 5 8v40" />
      <path d="M6 20h10" />
      {/* Dome */}
      <path d="M22 28c0-8 8-12 15-18 7 6 15 10 15 18" />
      <path d="M37 10V5" />
      {/* Hall */}
      <path d="M20 28h34v26H20z" />
      {/* Arched doors */}
      <path d="M27 54v-9a3 3 0 0 1 6 0v9M34 54v-11a3 3 0 0 1 6 0v11M41 54v-9a3 3 0 0 1 6 0v9" />
    </svg>
  );
}

const lineIcon = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  width: 28,
  height: 28,
} as const;

/** Fajr: sun rising over the horizon. */
export function SunriseIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M16 4v8M12 8l4-4 4 4" />
      <path d="M9 24a7 7 0 0 1 14 0" />
      <path d="M3 24h26M6 19l2 1.5M26 19l-2 1.5" />
      <path d="M8 28h16" />
    </svg>
  );
}

/** Dhuhr: sun at its height. */
export function SunIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M11 16a5 5 0 1 0 10 0 5 5 0 1 0-10 0" />
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8" />
    </svg>
  );
}

/** Asr: afternoon sun lowering, long shadows. */
export function AfternoonIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M10 18a6 6 0 0 1 12 0" />
      <path d="M16 6v4M7.5 10l2.5 2.5M24.5 10L22 12.5" />
      <path d="M3 18h26M6 23h20M10 28h12" />
    </svg>
  );
}

/** Maghrib: sun setting below the horizon. */
export function SunsetIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M16 4v8M12 8l4 4 4-4" />
      <path d="M9 24a7 7 0 0 1 14 0" />
      <path d="M3 24h26M6 19l2 1.5M26 19l-2 1.5" />
      <path d="M8 28h16" />
    </svg>
  );
}

/** Isha: crescent moon. */
export function MoonIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M21 5a11 11 0 1 0 6 17A9 9 0 0 1 21 5z" />
    </svg>
  );
}

/** Calendar (Jumu'ah). */
export function CalendarIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M5 8h22v19H5zM5 13h22M11 4v6M21 4v6" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...lineIcon} width={24} height={24} {...base} {...props}>
      <path d="M8 8l16 16M24 8L8 24" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M4 7h24v18H4zM4 7l12 10L28 7" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M16 29s9-8.2 9-15a9 9 0 0 0-18 0c0 6.8 9 15 9 15Z" />
      <circle cx="16" cy="14" r="3.5" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M11 4H6a2 2 0 0 0-2 2c0 12.2 9.8 22 22 22a2 2 0 0 0 2-2v-5l-6-2-3 3a16 16 0 0 1-7-7l3-3-2-6Z" />
    </svg>
  );
}

/* ---------- Brand marks (monochrome, currentColor) ---------- */

export function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      width="24"
      height="24"
      {...base}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" {...base} {...props}>
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4A21 21 0 0 0 14.3 4.3c-2.4 0-4 1.4-4 4.1v2.1H7.6v3h2.7V21h3.2Z" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" {...base} {...props}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" {...base} {...props}>
      <path d="M16.6 3c.3 2.3 1.7 3.8 4 4v2.7a7 7 0 0 1-4-1.3v6.2A5.7 5.7 0 1 1 11 9v2.9a2.9 2.9 0 1 0 2 2.7V3h3.6Z" />
    </svg>
  );
}

/** Two interlocking rings (nikah). */
export function RingsIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <circle cx="12" cy="18" r="7" />
      <circle cx="20" cy="18" r="7" />
      <path d="M10 8l2-3 2 3M18 8l2-3 2 3" />
    </svg>
  );
}

/** Open book on a stand (Qur’an). */
export function QuranIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M16 9c-3-2-7-2-11-1v14c4-1 8-1 11 1 3-2 7-2 11-1V8c-4-1-8-1-11 1Z" />
      <path d="M16 9v14M9 27l7-4 7 4" />
    </svg>
  );
}

/** Two people (community / sisters' classes). */
export function PeopleIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <circle cx="11" cy="10" r="4" />
      <circle cx="22" cy="11" r="3.5" />
      <path d="M3 26c0-5 4-8 8-8s8 3 8 8M18 19c1-.6 2.4-1 4-1 3.5 0 7 2.5 7 7" />
    </svg>
  );
}

/* ---------- Dashboard ---------- */

export function GridIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M5 5h9v9H5zM18 5h9v9h-9zM5 18h9v9H5zM18 18h9v9h-9z" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <circle cx="16" cy="16" r="11" />
      <path d="M16 9v7l5 3" />
    </svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M8 4h16v24l-4-2-4 2-4-2-4 2zM12 11h8M12 16h8M12 21h5" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M16 5v15M10 14l6 6 6-6M6 26h20" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M16 6v20M6 16h20" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M21 6l5 5L12 25H7v-5zM18 9l5 5" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M6 9h20M13 9V5h6v4M9 9l1 18h12l1-18M14 14v8M18 14v8" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <circle cx="14" cy="14" r="8" />
      <path d="M20 20l7 7" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M18 6h8v8M26 6L14 18M22 18v8H6V10h8" />
    </svg>
  );
}

/** Drag handle: two columns of three square dots. */
export function GripIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24} {...base} {...props}>
      <path d="M8 4h3v3H8zM13 4h3v3h-3zM8 10.5h3v3H8zM13 10.5h3v3h-3zM8 17h3v3H8zM13 17h3v3h-3z" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M13.5 4h5l.8 3.4 2.3 1.3 3.3-1 2.5 4.3-2.5 2.4v2.6l2.5 2.4-2.5 4.3-3.3-1-2.3 1.3-.8 3.4h-5l-.8-3.4-2.3-1.3-3.3 1L4.4 19.4 6.9 17v-2.6L4.4 12l2.5-4.3 3.3 1 2.3-1.3z" />
      <circle cx="16" cy="16" r="3.5" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M13 6H6v20h7M20 10l6 6-6 6M26 16H12" />
    </svg>
  );
}

/** Repeat / recurring arrows (regular giving). */
export function RepeatIcon(props: IconProps) {
  return (
    <svg {...lineIcon} {...base} {...props}>
      <path d="M6 14v-2a4 4 0 0 1 4-4h16M22 4l4 4-4 4M26 18v2a4 4 0 0 1-4 4H6M10 28l-4-4 4-4" />
    </svg>
  );
}
