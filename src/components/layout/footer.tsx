import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-mark';

const FOOTER_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'My Home', href: '/home' },
  { label: 'Insights', href: '/insights' },
  { label: 'AI Assistant', href: '/assistant' },
  { label: 'Forecast', href: '/forecast' },
  { label: 'Settings', href: '/settings' },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-12">
          {/* Brand & Credits */}
          <div className="space-y-3 md:col-span-5">
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BrandMark iconClassName="size-8 rounded-lg" nameClassName="text-base text-foreground" />
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Hyper-local air quality intelligence, India CPCB AQI tracking, and
              personalized indoor protection guidance powered by Open-Meteo and
              Gemini AI.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground/80">
              <span>
                Air &amp; Weather Data:{' '}
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/80 underline-offset-4 hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
                >
                  Open-Meteo
                </a>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Geocoding:{' '}
                <a
                  href="https://www.openstreetmap.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/80 underline-offset-4 hover:text-emerald-600 hover:underline dark:hover:text-emerald-400"
                >
                  OpenStreetMap
                </a>
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3 md:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Explore
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Health & Data Disclaimer */}
          <div className="md:col-span-4">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
              <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-foreground/90">
                <ShieldAlert className="size-3.5 text-amber-500" />
                <span>Health &amp; Data Disclaimer</span>
              </div>
              <p>
                Air quality readings combine modelled atmospheric estimates and
                nearby monitoring data. AI recommendations are for informational
                and preventive planning only and do not constitute medical
                advice. Consult a qualified healthcare professional for
                respiratory or medical conditions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border/40 pt-5 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; 2026 AeroPulse AI. Built for cleaner indoor &amp; outdoor living.</p>
          <p className="text-muted-foreground/75">
            India CPCB AQI Standard · Real-time Refresh
          </p>
        </div>
      </div>
    </footer>
  );
}
