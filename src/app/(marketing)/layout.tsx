import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lightbulb, Wind } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AirGuard AI — Breathe Smarter with Personalized Air Quality Intelligence",
  description:
    "Hyperlocal urban air quality monitoring, weather intelligence, home ventilation insights, festival alerts, and an AI assistant tailored to your daily life.",
};

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#impact", label: "Insights" },
] as const;

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col overflow-x-hidden bg-[#030712] text-slate-50",
        "selection:bg-emerald-500/30 selection:text-emerald-100"
      )}
    >
      {/* Top sticky glass navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#030712]/75 backdrop-blur-xl supports-[backdrop-filter]:bg-[#030712]/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2.5 focus:outline-none"
          >
            <span className="relative flex size-9 items-center justify-center rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/20 shadow-[0_0_24px_-4px_rgba(16,185,129,0.45)] transition-transform duration-300 group-hover:scale-105">
              <Wind className="size-4.5 text-emerald-300" />
            </span>
            <span className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white">
                AirGuard
              </span>
              <Badge
                variant="outline"
                className="border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-semibold tracking-wider text-emerald-300 uppercase"
              >
                <Lightbulb className="mr-0.5 size-2.5" />
                AI
              </Badge>
            </span>
          </Link>

          <nav
            aria-label="Primary marketing navigation"
            className="hidden items-center gap-8 md:flex"
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-emerald-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/login" />}
              className="hidden text-slate-300 hover:bg-white/[0.06] hover:text-white sm:inline-flex"
            >
              Sign in
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard" />}
              className="h-9 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-4 font-medium text-slate-950 shadow-[0_0_25px_-5px_rgba(20,184,166,0.65)] transition-all hover:brightness-110"
            >
              Dashboard
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

