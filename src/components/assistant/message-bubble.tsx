'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Bot, Check, Copy, RefreshCw, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

export interface MessageBubbleProps {
  message: AssistantMessage;
  isLastAssistant?: boolean;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

function formatMessageTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={idx}
          className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.82em] text-foreground"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return (
        <em key={idx} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre
          key={`code-${i}`}
          className="my-2 overflow-x-auto rounded-lg border border-border/60 bg-zinc-950/90 p-3 font-mono text-xs text-zinc-100"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i += 1;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const headingClass =
        level === 1
          ? 'mt-2.5 mb-1 text-base font-bold text-foreground first:mt-0'
          : level === 2
            ? 'mt-2.5 mb-1 text-sm font-semibold text-foreground first:mt-0'
            : 'mt-2 mb-0.5 text-sm font-medium text-foreground first:mt-0';
      blocks.push(
        <p key={`h-${i}`} className={headingClass}>
          {renderInlineMarkdown(text)}
        </p>
      );
      i += 1;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('> ')) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="my-1.5 border-l-2 border-emerald-500/60 pl-3 text-xs italic text-muted-foreground"
        >
          {quoteLines.map((ql, idx) => (
            <p key={idx}>{renderInlineMarkdown(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul
          key={`ul-${i}`}
          className="my-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol
          key={`ol-${i}`}
          className="my-1.5 list-decimal space-y-1 pl-5 text-sm leading-relaxed"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph (collect consecutive non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trimStart().startsWith('```') &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !lines[i].trimStart().startsWith('> ') &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i += 1;
    }

    blocks.push(
      <p key={`p-${i}`} className="my-1.5 text-sm leading-relaxed first:mt-0 last:mb-0">
        {paraLines.map((pl, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInlineMarkdown(pl)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className="space-y-1 break-words">{blocks}</div>;
}

export function MessageBubble({
  message,
  isLastAssistant = false,
  isLoading = false,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group flex w-full items-start gap-2.5 sm:gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="mt-0.5 size-8 shrink-0 shadow-xs">
        <AvatarFallback
          className={cn(
            'text-white',
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : 'bg-gradient-to-br from-emerald-500 to-teal-600'
          )}
        >
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex max-w-[85%] flex-col gap-1 sm:max-w-[78%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm shadow-xs',
            isUser
              ? 'rounded-tr-sm bg-blue-600 text-white dark:bg-blue-600'
              : cn(
                  'rounded-tl-sm border bg-zinc-100 text-zinc-900 dark:bg-zinc-800/90 dark:text-zinc-100',
                  message.isError
                    ? 'border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/15'
                    : 'border-border/70'
                )
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span className="tabular-nums">
            {formatMessageTime(message.timestamp)}
          </span>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopy}
                  aria-label="Copy message"
                  className="size-6 rounded-md text-muted-foreground opacity-70 transition-opacity hover:text-foreground group-hover:opacity-100"
                />
              }
            >
              {copied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </TooltipTrigger>
            <TooltipContent side="top">
              {copied ? 'Copied' : 'Copy message'}
            </TooltipContent>
          </Tooltip>

          {!isUser && isLastAssistant && onRegenerate && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={isLoading}
                    onClick={onRegenerate}
                    aria-label="Regenerate response"
                    className="h-6 gap-1 rounded-md px-1.5 text-[11px] text-muted-foreground opacity-80 transition-opacity hover:text-foreground group-hover:opacity-100"
                  />
                }
              >
                <RefreshCw className="size-3" />
                <span>Regenerate</span>
              </TooltipTrigger>
              <TooltipContent side="top">Regenerate last response</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </motion.div>
  );
}
