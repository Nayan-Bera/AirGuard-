'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, CheckCircle2, Flame, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface TimelinePhase {
  id: '14d' | '7d' | '3d' | 'event' | '3d_after';
  shortLabel: string;
  title: string;
  timeframe: string;
  summary: string;
  actions: string[];
}

const PHASES: TimelinePhase[] = [
  {
    id: '14d',
    shortLabel: '14d',
    title: 'Early Preparation',
    timeframe: '14 days before',
    summary: 'Audit indoor air protection gear before supply shortages or price spikes.',
    actions: [
      'Service air purifiers and inspect HEPA & activated-carbon filters',
      'Order replacement filters and N95/KN95 masks for the household',
      'Check window/door weatherstripping and draft seals',
    ],
  },
  {
    id: '7d',
    shortLabel: '7d',
    title: 'Readiness & Stocking',
    timeframe: '7 days before',
    summary: 'Finalize protective supplies and plan low-exposure schedules.',
    actions: [
      'Verify emergency inhalers & respiratory medications are stocked',
      'Shift outdoor workouts or morning walks to cleaner midday windows',
      'Brief sensitive family members (children, seniors, asthma patients)',
    ],
  },
  {
    id: '3d',
    shortLabel: '3d',
    title: 'Imminent Alert',
    timeframe: '3 days before',
    summary: 'Pre-clean indoor air and monitor regional pollution build-up.',
    actions: [
      'Wet-mop floors and wipe surfaces to reduce settled indoor dust',
      'Set air purifiers to medium/auto mode ahead of evening build-up',
      'Avoid burning incense, candles, or generating indoor smoke',
    ],
  },
  {
    id: 'event',
    shortLabel: 'Event',
    title: 'Peak Event Day',
    timeframe: 'Event day(s)',
    summary: 'Maximum containment during peak firecracker, bonfire, or traffic plumes.',
    actions: [
      'Keep all windows and balcony doors tightly sealed after sunset',
      'Run air purifiers on high in occupied bedrooms and living spaces',
      'Wear a snug-fit N95 mask if stepping outdoors is unavoidable',
    ],
  },
  {
    id: '3d_after',
    shortLabel: '3d after',
    title: 'Recovery & Flush',
    timeframe: 'Up to 3 days after',
    summary: 'Lingering haze can persist for 48–72 hours depending on wind speed.',
    actions: [
      'Wait for AQI to drop below 150 before opening windows for cross-ventilation',
      'Inspect and vacuum purifier pre-filters coated with soot/particulates',
      'Continue indoor filtration until baseline AQI recovers',
    ],
  },
];

interface WarningTimelineProps {
  eventName?: string;
  eventDate?: string;
  daysUntil?: number | null;
}

function resolveActivePhaseIndex(daysUntil?: number | null): number {
  if (daysUntil === null || daysUntil === undefined) return 0;
  if (daysUntil > 10) return 0; // 14d window
  if (daysUntil > 4) return 1; // 7d window
  if (daysUntil > 1) return 2; // 3d window
  if (daysUntil >= -1) return 3; // event window
  return 4; // 3d after
}

export function WarningTimeline({
  eventName,
  eventDate,
  daysUntil = null,
}: WarningTimelineProps) {
  const currentPhaseIndex = useMemo(() => resolveActivePhaseIndex(daysUntil), [daysUntil]);
  const [selectedIndex, setSelectedIndex] = useState<number>(currentPhaseIndex);

  const activePhase = PHASES[selectedIndex] ?? PHASES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
    >
      <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <CalendarClock className="size-4.5 text-amber-500" />
              Advance Warning Timeline
            </CardTitle>
            <CardDescription className="text-xs">
              {eventName ? (
                <>
                  Preparedness phases for{' '}
                  <span className="font-semibold text-foreground">{eventName}</span>
                  {eventDate ? ` (${eventDate})` : ''}
                </>
              ) : (
                '5-stage preparedness roadmap from 14 days before to 3 days after high-pollution events'
              )}
            </CardDescription>
          </div>

          {typeof daysUntil === 'number' && (
            <Badge
              variant="outline"
              className="border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-400 tabular-nums"
            >
              <Flame className="mr-1 size-3" />
              {daysUntil > 0
                ? `${daysUntil} days until event`
                : daysUntil === 0
                  ? 'Event is today'
                  : `${Math.abs(daysUntil)}d post-event`}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Visual Stepper Track: 14d -> 7d -> 3d -> event -> 3d after */}
          <div className="relative overflow-x-auto pb-2">
            <div className="relative flex min-w-[540px] items-start justify-between px-2 pt-3">
              {/* Connecting Baseline */}
              <div
                aria-hidden="true"
                className="absolute top-[25px] right-10 left-10 h-1 rounded-full bg-muted"
              />
              {/* Completed / Active Progress Fill */}
              <div
                aria-hidden="true"
                className="absolute top-[25px] left-10 h-1 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-500"
                style={{
                  width: `${(currentPhaseIndex / (PHASES.length - 1)) * 84}%`,
                }}
              />

              {PHASES.map((phase, idx) => {
                const isCurrent = idx === currentPhaseIndex;
                const isSelected = idx === selectedIndex;
                const isPast = idx < currentPhaseIndex;

                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className="group relative z-10 flex w-24 flex-col items-center gap-2 text-center focus-visible:outline-none"
                  >
                    <div className="relative flex items-center justify-center">
                      {isCurrent && (
                        <span className="absolute size-9 animate-ping rounded-full bg-amber-500/35" />
                      )}
                      <span
                        className={cn(
                          'relative flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-transform group-hover:scale-110',
                          isCurrent
                            ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/30'
                            : isPast
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-muted-foreground'
                        )}
                      >
                        {idx + 1}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <p
                        className={cn(
                          'text-xs font-bold',
                          isSelected ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {phase.shortLabel}
                      </p>
                      <p className="text-[10px] leading-tight text-muted-foreground">
                        {phase.title}
                      </p>
                      {isCurrent && (
                        <span className="inline-block rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                          Current
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Phase Actions Panel */}
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-emerald-500" />
                <h3 className="text-sm font-semibold">
                  {activePhase.title}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({activePhase.timeframe})
                  </span>
                </h3>
              </div>
              {selectedIndex === currentPhaseIndex && (
                <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                  Active Phase
                </Badge>
              )}
            </div>

            <p className="mb-3 text-xs text-muted-foreground">{activePhase.summary}</p>

            <ul className="grid gap-2 sm:grid-cols-3">
              {activePhase.actions.map((action, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/35 p-2.5 text-xs leading-relaxed"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
