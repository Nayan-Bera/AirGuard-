import { MarketingFooter } from '@/components/layout/marketing-footer';
import { MarketingHeader } from '@/components/layout/marketing-header';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dark relative flex min-h-screen flex-col overflow-hidden bg-[#030712] text-slate-50 [color-scheme:dark] selection:bg-emerald-500/30 selection:text-emerald-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(13,148,136,0.2),transparent_55%),linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:auto,64px_64px,64px_64px]" />
      <MarketingHeader />
      <div className="relative z-10 flex-1">{children}</div>
      <MarketingFooter />
    </div>
  );
}
