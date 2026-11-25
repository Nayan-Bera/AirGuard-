'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  Lightbulb,
  Wind,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AIRecommendationResponse } from '@/types';

interface RecommendationsCardProps {
  recommendations?: AIRecommendationResponse | null;
  aqi?: number | null;
  isLoading?: boolean;
}

interface ActionPreviewItem {
  id: string;
  title: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

function mapUrgencyToPriority(urgency: string): ActionPreviewItem['priority'] {
  const normalized = urgency.toLowerCase();
  if (normalized.includes('immediate') || normalized.includes('critical')) return 'critical';
  if (normalized.includes('today') || normalized.includes('high')) return 'high';
  if (normalized.includes('week') || normalized.includes('medium')) return 'medium';
  return 'low';
}

function getPriorityStyle(priority: ActionPreviewItem['priority']) {
  switch (priority) {
    case 'critical':
      return {
        badge: 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400',
        label: 'Critical',
        Icon: ShieldAlert,
        iconClass: 'text-red-500',
      };
    case 'high':
      return {
        badge: 'bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400',
        label: 'High',
        Icon: AlertTriangle,
        iconClass: 'text-orange-500',
      };
    case 'medium':
      return {
        badge: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
        label: 'Medium',
        Icon: Wind,
        iconClass: 'text-amber-500',
      };
    default:
      return {
        badge: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
        label: 'Low',
        Icon: CheckCircle2,
        iconClass: 'text-emerald-500',
      };
  }
}

export function RecommendationsCard({
  recommendations,
  aqi,
  isLoading = false,
}: RecommendationsCardProps) {
  if (isLoading) {
    return (
      <Card className="h-full border bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-7 w-20" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // Extract top 3-4 priority actions from AIResponse
  const items: ActionPreviewItem[] = React.useMemo(() => {
    if (!recommendations) return [];

    if (recommendations.priority_actions?.length) {
      return recommendations.priority_actions.slice(0, 4).map((pa, idx) => ({
        id: `pa-${idx}`,
        title: pa.action,
        reason: pa.reason,
        priority: mapUrgencyToPriority(pa.urgency),
      }));
    }

    const combined = [
      ...(recommendations.outdoor_recommendations ?? []),
      ...(recommendations.indoor_recommendations ?? []),
      ...(recommendations.family_recommendations ?? []),
      ...(recommendations.lifestyle_recommendations ?? []),
    ];

    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return combined
      .sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4))
      .slice(0, 4)
      .map((rec) => ({
        id: rec.id,
        title: rec.title,
        reason: rec.reason,
        priority: rec.priority,
      }));
  }, [recommendations]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25, ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="flex h-full flex-col border border-white/50 bg-white/75 backdrop-blur-xl shadow-lg dark:border-white/10 dark:bg-zinc-900/65">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Lightbulb className="size-4 text-violet-500" />
            AI Priority Actions
          </CardTitle>

          <Link
            href="/insights"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between gap-3">
          {items.length > 0 ? (
            <div className="space-y-2.5">
              {items.map((item) => {
                const style = getPriorityStyle(item.priority);
                const Icon = style.Icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                      <Icon className={cn('size-4', style.iconClass)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{item.title}</p>
                        <Badge
                          variant="outline"
                          className={cn('shrink-0 text-[10px]', style.badge)}
                        >
                          {style.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-background/40 p-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-500">
                <Lightbulb className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Personalized Guidance Ready</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  {aqi != null
                    ? `Current AQI is ${Math.round(aqi)}. Get tailored indoor, outdoor, and family actions in the AI Assistant.`
                    : 'Ask the AI Assistant for personalized recommendations based on your home profile and live AQI.'}
                </p>
              </div>
              <Link
                href="/assistant"
                className={cn(
                  buttonVariants({ size: 'sm', variant: 'outline' }),
                  'gap-1.5'
                )}
              >
                <Lightbulb className="size-3.5" />
                Ask AI Assistant
              </Link>
            </div>
          )}

          {recommendations?.disclaimer && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              {recommendations.disclaimer}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

