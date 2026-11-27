"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAQIColor } from "@/lib/utils/index";
import { useLocation } from "@/hooks/useLocation";
import { useAirQuality } from "@/hooks/useAirQuality";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageBubble,
  type AssistantMessage,
} from "@/components/assistant/message-bubble";
import { SuggestedQuestions } from "@/components/assistant/suggested-questions";

const MAX_MESSAGE_LENGTH = 2000;

function createMessageId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildApiHistory(messages: AssistantMessage[]) {
  const valid = messages.filter(
    (m) => !m.isError && m.content.trim().length > 0,
  );
  // Gemini startChat requires history to begin with a 'user' entry
  const firstUserIdx = valid.findIndex((m) => m.role === "user");
  if (firstUserIdx === -1) return [];
  return valid
    .slice(firstUserIdx)
    .slice(-50)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 sm:gap-3"
      aria-live="polite"
      aria-label="Assistant is typing"
    >
      <Avatar className="mt-0.5 size-8 shrink-0 shadow-xs">
        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border/70 bg-zinc-100 px-4 py-3 dark:bg-zinc-800/90">
        <span className="typing-dot size-2 rounded-full bg-emerald-500/80" />
        <span className="typing-dot size-2 rounded-full bg-emerald-500/80" />
        <span className="typing-dot size-2 rounded-full bg-emerald-500/80" />
      </div>
    </motion.div>
  );
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<AssistantMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string>("");

  React.useEffect(() => {
    setConversationId((prev) => prev || createMessageId());
  }, []);

  const { coordinates } = useLocation();
  const { data: airQuality } = useAirQuality(
    coordinates?.latitude,
    coordinates?.longitude,
  );

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessageToApi = React.useCallback(
    async (text: string, priorMessages: AssistantMessage[]) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMessage: AssistantMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      const nextMessages = [...priorMessages, userMessage];
      setMessages(nextMessages);
      setInput("");
      setIsLoading(true);

      try {
        const body: {
          message: string;
          conversationId: string;
          history: Array<{ role: "user" | "assistant"; content: string }>;
          latitude?: number;
          longitude?: number;
        } = {
          message: trimmed,
          conversationId,
          history: buildApiHistory(priorMessages),
        };

        if (coordinates) {
          body.latitude = coordinates.latitude;
          body.longitude = coordinates.longitude;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          const errMessage =
            data?.error?.message ||
            data?.error ||
            data?.message ||
            "Unable to reach the AI assistant right now. Please try again.";
          throw new Error(
            typeof errMessage === "string"
              ? errMessage
              : "Unable to reach the AI assistant right now.",
          );
        }

        if (data?.conversationId && typeof data.conversationId === "string") {
          setConversationId(data.conversationId);
        }

        const assistantMessage: AssistantMessage = {
          id: createMessageId(),
          role: "assistant",
          content:
            typeof data?.response === "string" &&
            data.response.trim().length > 0
              ? data.response
              : "I could not generate a response. Please try asking again.",
          timestamp: data?.timestamp || new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const errorText =
          err instanceof Error
            ? err.message
            : "Something went wrong while contacting the assistant.";

        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            content: errorText,
            timestamp: new Date().toISOString(),
            isError: true,
          },
        ]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [conversationId, coordinates, isLoading],
  );

  const handleSubmit = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;
      void sendMessageToApi(input, messages);
    },
    [input, isLoading, messages, sendMessageToApi],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleSelectSuggestion = React.useCallback(
    (question: string) => {
      if (isLoading) return;
      void sendMessageToApi(question, messages);
    },
    [isLoading, messages, sendMessageToApi],
  );

  const handleNewConversation = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setMessages([]);
    setInput("");
    setConversationId(createMessageId());
    textareaRef.current?.focus();
  }, []);

  const lastUserIndex = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") return i;
    }
    return -1;
  }, [messages]);

  const lastAssistantIndex = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  }, [messages]);

  const handleRegenerate = React.useCallback(() => {
    if (isLoading || lastUserIndex === -1) return;
    const lastUserMessage = messages[lastUserIndex];
    const priorMessages = messages.slice(0, lastUserIndex);
    void sendMessageToApi(lastUserMessage.content, priorMessages);
  }, [isLoading, lastUserIndex, messages, sendMessageToApi]);

  const currentAqi =
    typeof airQuality?.aqi === "number" && Number.isFinite(airQuality.aqi)
      ? airQuality.aqi
      : null;
  const aqiBadgeStyle = currentAqi !== null ? getAQIColor(currentAqi) : null;

  return (
    <Card className="flex h-[calc(100dvh-7.5rem)] min-h-[540px] max-h-[880px] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-border/70 bg-card/85 py-0 shadow-lg backdrop-blur-xl">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/20">
            <Bot className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
                AeroPulse AI Assistant
              </h1>
              {currentAqi !== null && aqiBadgeStyle ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "hidden sm:inline-flex text-[11px] font-medium",
                    aqiBadgeStyle.bg,
                    aqiBadgeStyle.text,
                    aqiBadgeStyle.border,
                  )}
                >
                  AQI {Math.round(currentAqi)} · {aqiBadgeStyle.label}
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="hidden sm:inline-flex gap-1 text-[11px] font-medium"
                >
                  <Lightbulb className="size-3 text-emerald-500" />
                  <span>CPCB Aware</span>
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              Real-time AQI, indoor air protection &amp; seasonal health
              guidance
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {lastAssistantIndex !== -1 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={handleRegenerate}
                    aria-label="Regenerate last response"
                    className="gap-1.5 rounded-xl text-xs"
                  />
                }
              >
                <RefreshCw
                  className={cn("size-3.5", isLoading && "animate-spin")}
                />
                <span className="hidden sm:inline">Regenerate</span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Regenerate last response
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNewConversation}
                  aria-label="New conversation"
                  className="gap-1.5 rounded-xl text-xs"
                />
              }
            >
              <MessageSquarePlus className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">New Chat</span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Start a new conversation
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Messages area */}
      <div className="chat-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex h-full max-w-xl flex-col items-center justify-center py-6 text-center"
          >
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-cyan-500/15 ring-1 ring-emerald-500/25">
              <Lightbulb className="size-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Ask anything about your air quality
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Get personalized advice powered by live CPCB AQI readings, local
              weather patterns, indoor ventilation guidance, and festival
              pollution alerts.
            </p>
            <div className="mt-5 grid w-full grid-cols-1 gap-2 text-left sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                <p className="text-xs font-semibold text-foreground">
                  Outdoor Timing
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Walk, run, and commute safety windows
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                <p className="text-xs font-semibold text-foreground">
                  Indoor Air
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Window ventilation &amp; purifier usage tips
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                <p className="text-xs font-semibold text-foreground">
                  Festival Prep
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Smog &amp; Diwali air quality readiness
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLastAssistant={index === lastAssistantIndex}
                isLoading={isLoading}
                onRegenerate={handleRegenerate}
              />
            ))}
            <AnimatePresence>
              {isLoading && <TypingIndicator />}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Bottom Suggested Questions + Composer */}
      <div className="shrink-0 border-t border-border/60 bg-background/80 px-4 pt-3 pb-3.5 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <SuggestedQuestions
            onSelect={handleSelectSuggestion}
            disabled={isLoading}
          />

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-2xl border border-border/80 bg-background p-2 shadow-xs transition-colors focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about today's AQI, ventilation, masks, or indoor air..."
              maxLength={MAX_MESSAGE_LENGTH}
              rows={1}
              disabled={isLoading}
              aria-label="Chat message input"
              className="max-h-36 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <div className="flex shrink-0 items-center gap-2 pb-0.5">
              {input.length > MAX_MESSAGE_LENGTH * 0.8 && (
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {input.length}/{MAX_MESSAGE_LENGTH}
                </span>
              )}
              <Button
                type="submit"
                size="icon-lg"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                className="size-9 rounded-xl bg-blue-600 text-white shadow-xs transition-transform hover:bg-blue-700 active:scale-95 disabled:opacity-40"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </form>

          <p className="text-center text-[11px] text-muted-foreground">
            Informational guidance based on CPCB AQI &amp; weather data — not a
            substitute for medical advice.
          </p>
        </div>
      </div>
    </Card>
  );
}
