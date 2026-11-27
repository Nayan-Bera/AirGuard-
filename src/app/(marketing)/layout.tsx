import type { Metadata } from "next";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AeroPulse AI — Breathe Smarter with Personalized Air Quality Intelligence",
  description:
    "Hyperlocal urban air quality monitoring, weather intelligence, home ventilation insights, festival alerts, and an AI assistant tailored to your daily life.",
};

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
      <MarketingHeader />

      <main className="flex-1">{children}</main>
    </div>
  );
}

