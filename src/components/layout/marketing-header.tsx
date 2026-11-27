'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/layout/brand-mark';
import { useAppSelector } from '@/lib/store/hooks';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#impact', label: 'Insights' },
] as const;

export function MarketingHeader() {
  const isAuthenticated = useAppSelector((state) => state.auth.status === 'authenticated');

  // Signed-in visitors use the app navigation instead.
  if (isAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#030712]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#030712]/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group rounded-lg transition-transform duration-300 hover:scale-[1.02] focus:outline-none">
          <BrandMark iconClassName="size-9 rounded-xl" nameClassName="text-base text-white" />
        </Link>
        <nav aria-label="Primary marketing navigation" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-slate-400 transition-colors hover:text-emerald-300">{item.label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />} className="hidden text-slate-300 hover:bg-white/[0.06] hover:text-white sm:inline-flex">
            Sign in
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/dashboard" />} className="h-9 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 font-medium text-slate-950 shadow-[0_0_25px_-5px_rgba(20,184,166,0.65)] transition-all hover:brightness-110">
            Check air quality <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
