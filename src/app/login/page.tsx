import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { currentUser } from '@/lib/auth';
import { buildMetadata } from '@/lib/seo';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = buildMetadata({
  title: 'Sign In',
  description: 'Sign in to your MobilExpertX account to manage your listings and orders.',
  path: '/login',
  noIndex: true,
});

/**
 * `/login` -- one page for both signing in and creating an account.
 *
 * Already-signed-in users are redirected, so the form is never shown to
 * someone who does not need it.
 */
export default function LoginPage() {
  const user = currentUser();
  if (user) redirect(user.role === 'admin' ? '/admin' : '/account');

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-surface-50 px-5 py-14">
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
