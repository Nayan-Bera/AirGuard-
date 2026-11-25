import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AirGuard AI — Smart Air Quality Assistant & Home Protection',
    template: '%s | AirGuard AI',
  },
  description:
    'Hyper-local air quality monitoring, CPCB AQI tracking, weather-aware forecasts, and personalized AI recommendations to protect your home and respiratory health.',
  keywords: [
    'air quality',
    'AQI',
    'CPCB AQI',
    'PM2.5',
    'PM10',
    'air purifier',
    'indoor air quality',
    'weather forecast',
    'AirGuard AI',
  ],
  authors: [{ name: 'AirGuard AI' }],
  openGraph: {
    title: 'AirGuard AI — Smart Air Quality Assistant',
    description:
      'Real-time AQI tracking, pollutant breakdown, and personalized AI guidance for healthier indoor and outdoor living.',
    type: 'website',
    locale: 'en_US',
    siteName: 'AirGuard AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AirGuard AI — Smart Air Quality Assistant',
    description:
      'Real-time AQI tracking, pollutant breakdown, and personalized AI guidance for healthier indoor and outdoor living.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('airguard-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-emerald-500/20 selection:text-emerald-600 dark:selection:text-emerald-400">
        <TooltipProvider delay={150}>
          <div className="relative flex min-h-screen flex-col">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
            >
              Skip to main content
            </a>
            <Navbar />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
