import { siteConfig } from '@/config/site';
import { Container } from '@/components/ui/container';

export function Footer() {
  return (
    <footer className="mt-auto bg-primary-500">
      <Container className="pt-8 pb-24 text-sm text-primary-100 sm:pb-28 lg:pb-32">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </Container>
    </footer>
  );
}
