import { SiteChrome } from '@/components/layout/site-chrome';

/** Layout for every public page (URLs are unchanged; the group name is not part of the URL). */
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return <SiteChrome>{children}</SiteChrome>;
}
