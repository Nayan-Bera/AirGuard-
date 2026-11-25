"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Cloud,
  Compass,
  Droplets,
  Home,
  Leaf,
  MapPin,
  MessageSquare,
  Radio,
  Shield,
  Lightbulb,
  Thermometer,
  Wind,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 24,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    title: "Real-time AQI",
    badge: "Live Telemetry",
    description:
      "Track hyperlocal air quality index scores alongside PM2.5, PM10, ozone, and nitrogen dioxide levels with clear health thresholds.",
    icon: Wind,
    accent: "from-emerald-500/20 to-teal-500/5 border-emerald-400/25",
    iconColor: "text-emerald-300",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(16,185,129,0.4)]",
    previewLabel: "PM2.5 · PM10 · O₃ · NO₂",
  },
  {
    title: "AI Recommendations",
    badge: "Personalized",
    description:
      "Actionable guidance calibrated to your sensitivity, commute windows, and outdoor workout schedule—not generic city-wide averages.",
    icon: Shield,
    accent: "from-teal-500/20 to-cyan-500/5 border-teal-400/25",
    iconColor: "text-teal-300",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(20,184,166,0.4)]",
    previewLabel: "Best run window: 6:30 – 8:30 AM",
  },
  {
    title: "Weather Intelligence",
    badge: "Atmospheric",
    description:
      "Understand how wind dispersion, humidity, and thermal inversions trap or clear pollutants across the next 24 to 72 hours.",
    icon: Cloud,
    accent: "from-cyan-500/20 to-sky-500/5 border-cyan-400/25",
    iconColor: "text-cyan-300",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(6,182,212,0.4)]",
    previewLabel: "Wind · Humidity · Dispersion",
  },
  {
    title: "Home Analysis",
    badge: "Indoor Care",
    description:
      "Optimize window ventilation timing, HVAC filtration, and purifier cycles based on your home layout and outdoor air spikes.",
    icon: Home,
    accent: "from-emerald-400/20 to-cyan-500/5 border-emerald-400/25",
    iconColor: "text-emerald-300",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(52,211,153,0.4)]",
    previewLabel: "Ventilation & filtration planner",
  },
  {
    title: "Festival Alerts",
    badge: "Proactive",
    description:
      "Receive early heads-ups ahead of regional celebrations, fireworks, and seasonal smoke surges so you can prepare your home in advance.",
    icon: Bell,
    accent: "from-teal-400/20 to-emerald-500/5 border-teal-400/25",
    iconColor: "text-teal-300",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(45,212,191,0.4)]",
    previewLabel: "Early spike warnings & prep checklists",
  },
  {
    title: "Smart Assistant",
    badge: "Conversational",
    description:
      "Ask natural questions about today's air, safe outdoor play hours, mask selection, or indoor air strategies and get instant answers.",
    icon: MessageSquare,
    accent: "from-cyan-400/20 to-teal-500/5 border-cyan-400/25",
    iconColor: "text-cyan-300",
    glow: "group-hover:shadow-[0_0_40px_-12px_rgba(34,211,238,0.4)]",
    previewLabel: "Context-aware Q&A",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Share Location",
    description:
      "Allow browser geolocation or enter your neighborhood to anchor telemetry to your exact urban micro-zone.",
    icon: MapPin,
    chip: "Zero-config geo lock",
    gradient: "from-emerald-500/25 via-emerald-500/5 to-transparent",
  },
  {
    step: "02",
    title: "Get Data",
    description:
      "AirGuard combines live pollutant sensors, meteorological dynamics, and upcoming seasonal events into one unified feed.",
    icon: Radio,
    chip: "Multi-source synthesis",
    gradient: "from-teal-500/25 via-teal-500/5 to-transparent",
  },
  {
    step: "03",
    title: "AI Insights",
    description:
      "Receive plain-language recommendations for outdoor exercise, home ventilation, and respiratory protection.",
    icon: Lightbulb,
    chip: "Personalized daily plan",
    gradient: "from-cyan-500/25 via-cyan-500/5 to-transparent",
  },
] as const;

const STATS = [
  {
    value: "24/7",
    label: "Atmospheric Tracking",
    detail: "Continuous pollutant & weather correlation",
  },
  {
    value: "6+",
    label: "Core Pollutants",
    detail: "PM2.5, PM10, O₃, NO₂, SO₂ & CO coverage",
  },
  {
    value: "< 2s",
    label: "AI Briefing Speed",
    detail: "Instant personalized guidance on demand",
  },
  {
    value: "360°",
    label: "Indoor & Outdoor",
    detail: "Bridging street air with home ventilation",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Knowing the exact morning window when particulate levels dip has completely changed when I schedule my city runs.",
    author: "Aarav M.",
    role: "Urban Marathon Runner",
    initials: "AM",
    avatarGradient: "from-emerald-400 to-teal-500",
  },
  {
    quote:
      "The home ventilation tips and festival alerts help us close windows and run purifiers hours before smoke rolls into our neighborhood.",
    author: "Priya S.",
    role: "Parent & Smart Home Owner",
    initials: "PS",
    avatarGradient: "from-teal-400 to-cyan-500",
  },
  {
    quote:
      "Instead of staring at raw pollutant numbers, the AI assistant tells me in one clear sentence what today's weather means for my commute.",
    author: "Daniel K.",
    role: "Daily Cyclist & Commuter",
    initials: "DK",
    avatarGradient: "from-cyan-400 to-emerald-500",
  },
] as const;

function AqiRingVisualization() {
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const decorativeProgress = 0.78;
  const strokeDashoffset = circumference * (1 - decorativeProgress);

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Soft ambient aura behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 opacity-80 blur-2xl"
      />

      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/65 py-6 text-slate-100 shadow-[0_24px_80px_-20px_rgba(16,185,129,0.35)] ring-0 backdrop-blur-2xl">
        {/* Top shimmer line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
        />

        <CardHeader className="px-6 pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium tracking-wide text-slate-300">
                Sample Urban Station
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-cyan-400/30 bg-cyan-500/10 text-[11px] text-cyan-200"
            >
              Illustrative Preview
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col items-center px-6 pt-2">
          {/* Animated AQI SVG Ring */}
          <div className="relative flex size-56 items-center justify-center sm:size-60">
            {/* Rotating dashed orbital ring */}
            <motion.svg
              viewBox="0 0 220 220"
              className="absolute inset-0 size-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
              aria-hidden="true"
            >
              <circle
                cx="110"
                cy="110"
                r="102"
                fill="none"
                stroke="rgba(45, 212, 191, 0.16)"
                strokeWidth="1"
                strokeDasharray="4 8"
              />
            </motion.svg>

            {/* Breathing inner glow */}
            <motion.div
              aria-hidden="true"
              className="absolute size-36 rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/20 blur-xl"
              animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.55, 0.85, 0.55] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Progress Ring */}
            <svg
              viewBox="0 0 200 200"
              className="relative size-48 -rotate-90 sm:size-52"
              role="img"
              aria-label="Decorative AQI ring visualization showing sample score 38"
            >
              <defs>
                <linearGradient
                  id="aqiRingGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="50%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>

              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="12"
              />

              <motion.circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="url(#aqiRingGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>

            {/* Center Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium tracking-widest text-emerald-300/80 uppercase">
                Sample AQI
              </span>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="bg-gradient-to-b from-white via-slate-100 to-emerald-200 bg-clip-text text-5xl font-bold tracking-tight text-transparent"
              >
                38
              </motion.span>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                <Leaf className="size-3" />
                Clean Air
              </span>
            </div>
          </div>

          {/* Mini Decorative Telemetry Pills */}
          <div className="mt-2 grid w-full grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Activity className="size-3 text-emerald-400" />
                PM2.5
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-100">
                9.2 µg/m³
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Droplets className="size-3 text-teal-400" />
                Humidity
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-100">
                54%
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-2.5 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
                <Thermometer className="size-3 text-cyan-400" />
                Temp
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-100">
                22°C
              </div>
            </div>
          </div>

          {/* Sample AI insight bar */}
          <div className="mt-3 flex w-full items-start gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-3 text-left">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-emerald-300" />
            <p className="text-xs leading-relaxed text-slate-300">
              <span className="font-medium text-emerald-200">AI Brief:</span>{" "}
              Steady crosswinds are keeping particulates low. Ideal conditions
              for open-window ventilation and outdoor runs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Subtle architectural grid background */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          "bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)]",
          "bg-[size:64px_64px]",
          "[mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_55%,transparent_100%)]"
        )}
      />

      {/* Animated ambient gradient orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 overflow-hidden"
      >
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 15, 0],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto -mt-36 h-[480px] w-[760px] rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 blur-[120px]"
        />
      </div>

      {/* HERO SECTION */}
      <section className="relative mx-auto max-w-7xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8 lg:pt-24 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Hero Copy */}
          <div className="text-center lg:col-span-7 lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex justify-center lg:justify-start"
            >
              <Badge
                variant="outline"
                className="h-7 gap-2 border-emerald-400/30 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-200 backdrop-blur-md"
              >
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                Urban Air Quality Intelligence
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem] xl:leading-[1.08]"
            >
              Breathe{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                Smarter with AI
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg lg:mx-0"
            >
              Personalized air quality intelligence that turns complex pollutant
              streams, weather shifts, indoor home dynamics, and seasonal
              festival alerts into clear, everyday decisions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row lg:justify-start"
            >
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/dashboard" />}
                className={cn(
                  "h-12 w-full rounded-full px-7 text-sm font-semibold text-slate-950 sm:w-auto",
                  "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400",
                  "shadow-[0_0_36px_-6px_rgba(20,184,166,0.7)] transition-all hover:scale-[1.02] hover:brightness-110"
                )}
              >
                Check Your Air Quality
                <ArrowRight className="size-4" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                render={<a href="#how-it-works" />}
                className="h-12 w-full rounded-full border-white/15 bg-white/[0.04] px-6 text-sm font-medium text-slate-200 backdrop-blur-md hover:bg-white/[0.08] hover:text-white sm:w-auto"
              >
                <Compass className="size-4 text-teal-300" />
                See How It Works
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.34 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-slate-400 lg:justify-start"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                Hyperlocal AQI & Weather
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-teal-400" />
                Home Ventilation Guidance
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-cyan-400" />
                Festival Spike Alerts
              </span>
            </motion.div>
          </div>

          {/* Right Hero Visual: Decorative Animated AQI Ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <AqiRingVisualization />
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION (6 Cards) */}
      <section
        id="features"
        className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <Badge
            variant="outline"
            className="border-teal-400/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-200"
          >
            Core Capabilities
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Six layers of{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              environmental clarity
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Designed to bridge raw atmospheric readings with practical,
            personalized protection for your routine and your home.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title} delay={index * 0.06}>
                <Card
                  className={cn(
                    "group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/45 py-6 text-slate-100 ring-0 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-slate-900/70",
                    feature.glow
                  )}
                >
                  {/* Hover top gradient line */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  <CardHeader className="px-6">
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl border bg-gradient-to-br",
                          feature.accent
                        )}
                      >
                        <Icon className={cn("size-5", feature.iconColor)} />
                      </div>
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-white/[0.04] text-[11px] font-medium text-slate-300"
                      >
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-lg font-semibold text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between px-6">
                    <CardDescription className="text-sm leading-relaxed text-slate-400">
                      {feature.description}
                    </CardDescription>

                    {/* Decorative gradient footer placeholder instead of external images */}
                    <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent px-3 py-2">
                      <span className="text-[11px] font-medium text-slate-300">
                        {feature.previewLabel}
                      </span>
                      <span className="size-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS SECTION (3 Steps) */}
      <section
        id="how-it-works"
        className="relative border-y border-white/[0.07] bg-slate-950/60 py-20 lg:py-28"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.12),transparent_60%)]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <Badge
              variant="outline"
              className="border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200"
            >
              How It Works
            </Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From raw atmosphere to{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                clear action in seconds
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Three effortless steps turn complex environmental telemetry into
              daily confidence.
            </p>
          </ScrollReveal>

          <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
            {/* Desktop connecting hairline */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-14 right-16 left-16 hidden h-px bg-gradient-to-r from-emerald-500/40 via-teal-400/50 to-cyan-500/40 lg:block"
            />

            {STEPS.map((item, index) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={item.step} delay={index * 0.1}>
                  <Card className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 py-6 text-slate-100 ring-0 backdrop-blur-xl">
                    <div
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-0 bg-gradient-to-b opacity-60",
                        item.gradient
                      )}
                    />
                    <CardHeader className="relative px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-slate-950/80 shadow-[0_0_24px_-6px_rgba(20,184,166,0.5)]">
                          <Icon className="size-5 text-emerald-300" />
                        </div>
                        <span className="font-mono text-sm font-semibold tracking-wider text-teal-300/80">
                          STEP {item.step}
                        </span>
                      </div>
                      <CardTitle className="mt-5 text-xl font-semibold text-white">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative px-6">
                      <p className="text-sm leading-relaxed text-slate-300">
                        {item.description}
                      </p>
                      <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-emerald-200">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        {item.chip}
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS & TESTIMONIALS SECTION */}
      <section
        id="impact"
        className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        {/* Stats grid */}
        <ScrollReveal>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-slate-900/45 p-6 backdrop-blur-xl"
              >
                <div className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {stat.label}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Testimonials */}
        <ScrollReveal className="mt-20 text-center">
          <Badge
            variant="outline"
            className="border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200"
          >
            Built for Everyday Clarity
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How city dwellers use AirGuard AI
          </h2>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <ScrollReveal key={item.author} delay={index * 0.08}>
              <Card className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/45 py-6 text-slate-100 ring-0 backdrop-blur-xl">
                <CardContent className="px-6">
                  <div className="mb-4 flex items-center gap-1 text-emerald-400">
                    <Lightbulb className="size-4" />
                    <span className="text-xs font-medium text-emerald-300/90">
                      Daily Workflow
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </CardContent>

                <CardContent className="mt-6 flex items-center gap-3 px-6 pt-0">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-slate-950",
                      item.avatarGradient
                    )}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.author}
                    </div>
                    <div className="text-xs text-slate-400">{item.role}</div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <ScrollReveal className="mt-20">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 via-slate-900/80 to-cyan-500/15 p-8 text-center shadow-[0_20px_80px_-25px_rgba(16,185,129,0.4)] backdrop-blur-2xl sm:p-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent"
            />
            <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-4xl">
              See what your neighborhood air looks like right now
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
              Open the AirGuard AI dashboard for live atmospheric telemetry,
              home ventilation guidance, and personalized AI briefings.
            </p>
            <div className="mt-7 flex justify-center">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/dashboard" />}
                className="h-12 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-8 text-sm font-semibold text-slate-950 shadow-[0_0_32px_-6px_rgba(20,184,166,0.75)] transition-all hover:scale-[1.02] hover:brightness-110"
              >
                Check Your Air Quality
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* FOOTER WITH DISCLAIMER */}
      <footer className="border-t border-white/[0.08] bg-[#020611] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10">
                <Wind className="size-4 text-emerald-300" />
              </span>
              <div>
                <div className="text-sm font-semibold text-white">
                  AirGuard AI
                </div>
                <div className="text-xs text-slate-400">
                  Urban Air Quality Assistant
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
              <a
                href="#features"
                className="transition-colors hover:text-emerald-300"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="transition-colors hover:text-emerald-300"
              >
                How It Works
              </a>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-emerald-300"
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="transition-colors hover:text-emerald-300"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-white/[0.06] pt-6 text-xs leading-relaxed text-slate-500">
            <p>
              <span className="font-medium text-slate-400">Disclaimer:</span>{" "}
              AirGuard AI provides environmental air quality estimates,
              predictive trends, and AI-generated wellness and home-ventilation
              suggestions for informational purposes only. It is not a medical
              device and does not substitute for professional medical advice,
              diagnosis, or official municipal emergency alerts. Always consult a
              qualified healthcare provider regarding respiratory or
              cardiovascular conditions.
            </p>
            <p className="mt-3 text-slate-600">
              © 2026 AirGuard AI. Built for cleaner, smarter urban living.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

