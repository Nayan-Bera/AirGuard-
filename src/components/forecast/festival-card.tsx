'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Flame,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FestivalEvent } from '@/types';

export interface FestivalCardProps {
  festival: FestivalEvent;
  daysUntil?: number;
  warningLevel?: 'prepare' | 'imminent' | 'active' | 'recovery';
  preparations?: string[];
  defaultExpanded?: boolean;
  index?: number;
}

const IMPACT_META: Record<
  FestivalEvent['pollutionImpact'],
  { label: string; badgeClass: string; borderClass: string }
> = {
  none: {
    label: 'Minimal Impact',
    badgeClass: 'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400',
    borderClass: 'border-border/60',
  },
  low: {
    label: 'Low Impact',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/20',
  },
  medium: {
    label: 'Moderate Impact',
    badgeClass: 'border-amber-500/35 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
  },
  high: {
    label: 'High Impact',
    badgeClass: 'border-orange-500/35 bg-orange-500/10 text-orange-600 dark:text-orange-400',
    borderClass: 'border-orange-500/35',
  },
  very_high: {
    label: 'Very High Impact',
    badgeClass: 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400',
    borderClass: 'border-red-500/40',
  },
};

function getDefaultPreparations(impact: FestivalEvent['pollutionImpact']): string[] {
  if (impact === 'very_high' || impact === 'high') {
    return [
      'Service your air purifier and verify HEPA filter condition',
      'Stock N95 / PM2.5 respirator masks for all family members',
      'Seal windows and doors during evening & night peak hours',
      'Avoid outdoor exercise on festival night and the morning after',
    ];
  }
  if (impact === 'medium') {
    return [
      'Keep windows closed during evening bonfire or celebration hours',
      'Run indoor air purifiers or keep doors sealed near busy roads',
      'Monitor live AQI before stepping outside',
    ];
  }
  return [
    'Monitor local AQI levels during evening hours',
    'Prefer low-smoke or eco-friendly celebrations',
  ];
}

function formatFestivalDate(dateStr: string, endDateStr?: string): string {
  const start = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(start.getTime())) return dateStr;
  const startFmt = start.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (!endDateStr) return startFmt;
  const end = new Date(`${endDateStr}T00:00:00`);
  if (Number.isNaN(end.getTime())) return startFmt;
  return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function formatDaysUntil(days: number): string {
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function FestivalCard({
  festival,
  daysUntil,
  warningLevel,
  preparations,
  defaultExpanded = false,
  index = 0,
}: FestivalCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const computedDaysUntil = useMemo(() => {
    if (typeof daysUntil === 'number') return daysUntil;
    const target = new Date(`${festival.date}T00:00:00`).getTime();
    if (Number.isNaN(target)) return 0;
    return Math.ceil((target - Date.now()) / (24 * 60 * 60 * 1000));
  }, [daysUntil, festival.date]);

  const impactMeta = IMPACT_META[festival.pollutionImpact];
  const prepList =
    preparations && preparations.length > 0
      ? preparations
      : getDefaultPreparations(festival.pollutionImpact);

  const historicalData = useMemo(() => {
    const h = festival.historicalAQIImpact;
    if (!h) return null;
    return [
      { stage: 'Before', aqi: h.avgAQIBefore, color: '#eab308' },
      { stage: 'During', aqi: h.avgAQIDuring, color: '#ef4444' },
      { stage: 'Peak', aqi: h.peakAQI, color: '#991b1b' },
      { stage: 'After', aqi: h.avgAQIAfter, color: '#f97316' },
    ];
  }, [festival.historicalAQIImpact]);

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedCount = prepList.filter((_, i) => checkedItems[i]).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3) }}
    >
      <Card
        className={cn(
          'h-full border bg-white/75 backdrop-blur-xl shadow-md transition-shadow hover:shadow-lg dark:bg-zinc-900/65',
          impactMeta.borderClass
        )}
      >
        <CardHeader className="space-y-2 pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="flex items-center gap-1.5 text-base font-bold">
                  <Flame className="size-4 text-amber-500" />
                  {festival.name}
                </CardTitle>
                {warningLevel && (
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                    {warningLevel}
                  </Badge>
                )}
              </div>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formatFestivalDate(festival.date, festival.endDate)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {festival.region.replace('-', ' ')}
                </span>
              </CardDescription>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <Badge variant="outline" className={cn('text-xs font-semibold', impactMeta.badgeClass)}>
                {impactMeta.label}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground tabular-nums">
                <Clock className="size-3" />
                {formatDaysUntil(computedDaysUntil)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {festival.description}
          </p>

          {/* Pollution Types */}
          <div className="flex flex-wrap items-center gap-1.5">
            {festival.pollutionType.map((type) => (
              <Badge
                key={type}
                variant="secondary"
                className="rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium"
              >
                {type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>

          {/* Historical AQI Impact Mini Chart */}
          {historicalData && festival.historicalAQIImpact && (
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-foreground">
                  Historical AQI Impact Profile
                </span>
                <span className="text-muted-foreground tabular-nums">
                  Recovery: ~{festival.historicalAQIImpact.recoveryDays} days
                </span>
              </div>
              <div className="h-[130px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart
                    data={historicalData}
                    margin={{ top: 6, right: 6, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.16} vertical={false} />
                    <XAxis
                      dataKey="stage"
                      tick={{ fontSize: 11, fill: 'currentColor' }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'currentColor' }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(val) => [`${val} AQI`, 'Typical AQI']}
                      contentStyle={{
                        borderRadius: '10px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="aqi" radius={[5, 5, 0, 0]} maxBarSize={36}>
                      {historicalData.map((entry) => (
                        <Cell key={entry.stage} fill={entry.color} fillOpacity={0.88} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Expandable Preparations Checklist */}
          <div className="rounded-xl border border-border/60 bg-muted/30">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold hover:bg-muted/60"
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="size-3.5 text-emerald-500" />
                Preparations Checklist
                <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
                  ({completedCount}/{prepList.length})
                </span>
              </span>
              {expanded ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </Button>

            {expanded && (
              <div className="space-y-1.5 border-t border-border/50 px-3 py-2.5">
                {prepList.map((item, idx) => {
                  const checked = !!checkedItems[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleCheck(idx)}
                      className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left text-xs transition-colors hover:bg-background/70"
                    >
                      {checked ? (
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          'leading-relaxed',
                          checked && 'text-muted-foreground line-through'
                        )}
                      >
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
