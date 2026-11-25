'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const SUGGESTED_QUESTIONS = [
  'Is it safe to go outside today?',
  'Should I open my windows?',
  'What precautions for my morning walk?',
  'How to improve indoor air quality?',
  'What should I prepare before Diwali?',
] as const;

export interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SuggestedQuestions({
  onSelect,
  disabled = false,
  className,
}: SuggestedQuestionsProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-medium text-muted-foreground">
        <Lightbulb className="size-3 text-emerald-500" />
        <span>Suggested questions</span>
      </div>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Suggested air quality questions"
      >
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <motion.div
            key={question}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.04 }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onSelect(question)}
              className={cn(
                'h-auto rounded-full border-border/70 bg-background/80 px-3 py-1.5 text-xs font-normal text-foreground/85 shadow-2xs backdrop-blur-sm transition-all',
                'hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300',
                'active:scale-[0.98]'
              )}
            >
              {question}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

