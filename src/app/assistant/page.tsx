import type { Metadata } from 'next';
import { ChatInterface } from '@/components/assistant/chat-interface';

export const metadata: Metadata = {
  title: 'AI Air Quality Assistant',
  description:
    'Chat with AeroPulse AI for real-time CPCB AQI insights, indoor ventilation advice, outdoor safety tips, and festival smog preparation.',
};

export default function AssistantPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-background to-emerald-50/30 dark:from-zinc-950 dark:via-background dark:to-emerald-950/15">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <ChatInterface />
      </div>
    </div>
  );
}
