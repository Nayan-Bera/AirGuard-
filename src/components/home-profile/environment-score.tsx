'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Flame,
  Info,
  Leaf,
  MapPin,
  ShieldCheck,
  Lightbulb,
  Wind,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateHomeEnvironmentScore } from '@/services/recommendations';
import { cn } from '@/lib/utils';
import type { HouseholdPlant, HouseholdProfile } from '@/types';

interface EnvironmentScoreProps {
  profile: HouseholdProfile;
  plants: HouseholdPlant[];
  currentAQI?: number | null;
  className?: string;
}

function getScoreTheme(score: number): {
  label: string;
  stroke: string;
  textClass: string;
  badgeClass: string;
  barClass: string;
  ringBg: string;
} {
  if (score >= 75) {
    return {
      label: 'Well Prepared',
      stroke: '#10b981',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      badgeClass:
        'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
      barClass: '[&_[data-slot=progress-indicator]]:bg-emerald-500',
      ringBg: 'from-emerald-500/15 to-teal-500/5',
    };
  }
  if (score >= 55) {
    return {
      label: 'Moderate Setup',
      stroke: '#eab308',
      textClass: 'text-amber-600 dark:text-amber-400',
      badgeClass:
        'border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300',
      barClass: '[&_[data-slot=progress-indicator]]:bg-amber-500',
      ringBg: 'from-amber-500/15 to-yellow-500/5',
    };
  }
  if (score >= 35) {
    return {
      label: 'Needs Attention',
      stroke: '#f97316',
      textClass: 'text-orange-600 dark:text-orange-400',
      badgeClass:
        'border-orange-500/30 bg-orange-500/12 text-orange-700 dark:text-orange-300',
      barClass: '[&_[data-slot=progress-indicator]]:bg-orange-500',
      ringBg: 'from-orange-500/15 to-amber-500/5',
    };
  }
  return {
    label: 'High Vulnerability',
    stroke: '#ef4444',
    textClass: 'text-red-600 dark:text-red-400',
    badgeClass:
      'border-red-500/30 bg-red-500/12 text-red-700 dark:text-red-300',
    barClass: '[&_[data-slot=progress-indicator]]:bg-red-500',
    ringBg: 'from-red-500/15 to-rose-500/5',
  };
}

export function EnvironmentScore({
  profile,
  plants,
  currentAQI,
  className,
}: EnvironmentScoreProps) {
  const score = React.useMemo(
    () =>
      calculateHomeEnvironmentScore(
        profile,
        plants,
        typeof currentAQI === 'number' ? currentAQI : undefined
      ),
    [profile, plants, currentAQI]
  );

  const overallTheme = getScoreTheme(score.overall);

  const size = 168;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(100, Math.max(0, score.overall)) / 100);

  const breakdownItems = [
    {
      key: 'ventilation',
      label: 'Ventilation',
      value: score.ventilation,
      icon: Wind,
      hint: 'Cross-ventilation, exhaust & kitchen airflow',
    },
    {
      key: 'airPurification',
      label: 'Purification',
      value: score.airPurification,
      icon: Lightbulb,
      hint: 'Air purifier, AC filtration & window control',
    },
    {
      key: 'greenery',
      label: 'Greenery',
      value: score.greenery,
      icon: Leaf,
      hint: 'Indoor plants, balcony & garden presence',
    },
    {
      key: 'pollutionExposure',
      label: 'Pollution Exposure',
      value: score.pollutionExposure,
      icon: MapPin,
      hint: 'Buffer from roads, industry & floor elevation',
    },
    {
      key: 'indoorSources',
      label: 'Indoor Sources',
      value: score.indoorSources,
      icon: Flame,
      hint: 'Cooking fuel, incense & dust control',
    },
  ];

  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-white/50 bg-white/80 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/70',
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-gradient-to-br blur-3xl',
          overallTheme.ringBg
        )}
      />

      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <ShieldCheck className="size-4.5 text-emerald-500" />
          Home Environment Score
        </CardTitle>
        <Badge variant="outline" className={cn('font-medium', overallTheme.badgeClass)}>
          {overallTheme.label}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          {/* Circular Gauge */}
          <div className="relative flex shrink-0 items-center justify-center">
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/60"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={overallTheme.stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className={cn(
                  'text-4xl font-bold tracking-tight tabular-nums',
                  overallTheme.textClass
                )}
              >
                {score.overall}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                out of 100
              </span>
            </div>
          </div>

          {/* Sub-score Breakdown */}
          <div className="w-full flex-1 space-y-3">
            {breakdownItems.map((item) => {
              const Icon = item.icon;
              const subTheme = getScoreTheme(item.value);
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Icon className={cn('size-3.5', subTheme.textClass)} />
                      {item.label}
                    </span>
                    <span className={cn('font-semibold tabular-nums', subTheme.textClass)}>
                      {item.value}/100
                    </span>
                  </div>
                  <Progress
                    value={item.value}
                    className={cn('gap-0', subTheme.barClass)}
                    aria-label={`${item.label} score ${item.value} out of 100`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {score.recommendations.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3 space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <AlertCircle className="size-3.5 text-amber-500" />
              Quick Score Boosters
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {score.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="flex items-start gap-1.5">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-emerald-500" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/80" />
          <span>
            This score reflects household actions and setup, not measured indoor air quality
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

