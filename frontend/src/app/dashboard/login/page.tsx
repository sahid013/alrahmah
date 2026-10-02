import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';
import { LoginFlow } from '@/components/dashboard/auth/login-flow';
import { siteConfig } from '@/config/site';
import { AUTH_ENABLED } from '@/lib/dashboard/auth/types';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  // Sign-in switched off: there's nothing to sign in to.
  if (!AUTH_ENABLED) redirect('/dashboard');
  return (
    <main
      id="main"
      className="relative isolate flex min-h-svh flex-col items-center justify-center gap-8 bg-primary-900 px-4 py-12"
    >
      {/* Star pattern kept barely visible (0.1% opacity). */}
      <div aria-hidden className="bg-islamic-pattern absolute inset-0 -z-10 opacity-[0.001]" />
      <Image
        src={siteConfig.logoLight}
        alt={siteConfig.legalName}
        width={600}
        height={149}
        priority
        className="h-12 w-auto"
      />
      <Suspense>
        <LoginFlow />
      </Suspense>
    </main>
  );
}
