'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { BrowserAlertMonitor } from '@/components/layout/browser-alert-monitor';
import { useAppSelector } from '@/lib/store/hooks';

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMarketingPage = pathname === '/';
  const authStatus = useAppSelector((state) => state.auth.status);
  const isAuthenticated = authStatus === 'authenticated';
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPublicPage = isMarketingPage || isAuthPage;
  const canShowPage = isPublicPage || isAuthenticated;

  useEffect(() => {
    if (!isPublicPage && authStatus === 'unauthenticated') router.replace('/login');
  }, [authStatus, isPublicPage, router]);

  return (
    <>
      {isAuthenticated && !isAuthPage && <BrowserAlertMonitor />}
      {isAuthenticated && !isAuthPage && <Navbar />}
      <main id="main-content" className="flex-1">
        {canShowPage ? children : (
          <div className="container mx-auto flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Checking your session…
          </div>
        )}
      </main>
      {isAuthenticated && !isMarketingPage && !isAuthPage && <Footer />}
    </>
  );
}
