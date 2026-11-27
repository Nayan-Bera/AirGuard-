import Link from 'next/link';
import { Wind } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#020611] py-12 text-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <Link href="/" aria-label="AeroPulse AI home" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
            <span className="flex size-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/20 text-emerald-300">
              <Wind className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">AeroPulse AI</span>
              <span className="block text-xs text-slate-400">Urban Air Quality Assistant</span>
            </span>
          </Link>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
            <Link href="/#features" className="transition-colors hover:text-emerald-300">Features</Link>
            <Link href="/#how-it-works" className="transition-colors hover:text-emerald-300">How It Works</Link>
            <Link href="/dashboard" className="transition-colors hover:text-emerald-300">Dashboard</Link>
            <Link href="/login" className="transition-colors hover:text-emerald-300">Sign In</Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/[0.06] pt-6 text-xs leading-relaxed text-slate-500">
          <p>
            <span className="font-medium text-slate-400">Disclaimer:</span>{' '}
            AeroPulse AI provides environmental air quality estimates, predictive trends, and AI-generated wellness and home-ventilation suggestions for informational purposes only. It is not a medical device and does not substitute for professional medical advice, diagnosis, or official municipal emergency alerts. Always consult a qualified healthcare provider regarding respiratory or cardiovascular conditions.
          </p>
          <p className="mt-3 text-slate-600">© 2026 AeroPulse AI. Built for cleaner, smarter urban living.</p>
        </div>
      </div>
    </footer>
  );
}
