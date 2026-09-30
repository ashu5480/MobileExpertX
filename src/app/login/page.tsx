import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { ensureAdminUser, currentUser } from '@/lib/auth';
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
 * Seeds the admin account on first visit, so a brand-new install can sign in
 * as admin immediately rather than waiting for a customer to register.
 * Already-signed-in users are redirected, so the form is never shown to
 * someone who does not need it.
 */
export default async function LoginPage() {
  try {
    await ensureAdminUser();
  } catch (error) {
    console.error('[auth] admin bootstrap failed:', error);
  }

  const user = await currentUser();
  if (user) redirect(user.role === 'admin' ? '/admin' : '/');

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-surface-50 px-5 py-14">
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
