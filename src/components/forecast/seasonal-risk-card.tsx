'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Flame,
  ShieldCheck,
  Snowflake,
  Sun,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface SeasonalRiskData {
  season: string;
  riskLevel: string;
  description: string;
  factors: string[];
  recommendations: string[];
}

interface SeasonalRiskCardProps {
  seasonalRisk: SeasonalRiskData | null;
  isLoading?: boolean;
}

function getRiskBadgeStyle(riskLevel: string): string {
  const normalized = riskLevel.toLowerCase();
  if (normalized.includes('high')) {
    return 'border-red-500/35 bg-red-500/10 text-red-600 dark:text-red-400';
  }
  if (normalized.includes('moderate')) {
    return 'border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }
  return 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
}

function getSeasonIcon(season: string) {
  const s = season.toLowerCase();
  if (s.includes('winter')) return Snowflake;
  if (s.includes('summer')) return Sun;
  if (s.includes('post')) return Flame;
  if (s.includes('monsoon')) return CloudRain;
  return ShieldCheck;
}

export function SeasonalRiskCard({ seasonalRisk, isLoading = false }: SeasonalRiskCardProps) {
  if (isLoading) {
    return (
      <Card className="border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (!seasonalRisk) return null;

  const SeasonIcon = getSeasonIcon(seasonalRisk.season);
  const badgeStyle = getRiskBadgeStyle(seasonalRisk.riskLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <SeasonIcon className="size-4.5 text-sky-500" />
              Seasonal Risk Assessment · {seasonalRisk.season}
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              {seasonalRisk.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn('text-xs font-semibold', badgeStyle)}>
            {seasonalRisk.riskLevel} Risk
          </Badge>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Contributing Factors */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertTriangle className="size-3.5 text-amber-500" />
              Contributing Factors
            </h3>
            <ul className="space-y-2">
              {seasonalRisk.factors.map((factor, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Recommended Actions
            </h3>
            <ul className="space-y-2">
              {seasonalRisk.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
