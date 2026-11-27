import { Wind } from 'lucide-react';

interface BrandMarkProps {
  className?: string;
  iconClassName?: string;
  showName?: boolean;
  nameClassName?: string;
}

export function BrandMark({
  className = '',
  iconClassName = 'size-9 rounded-xl',
  showName = true,
  nameClassName = '',
}: BrandMarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className={`relative flex shrink-0 items-center justify-center border border-white/25 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 text-white shadow-[0_5px_18px_-5px_rgba(20,184,166,0.65)] ${iconClassName}`}>
        <Wind className="size-1/2" strokeWidth={2.4} />
        <span className="absolute -right-1 -bottom-1 size-2.5 rounded-full border border-white/80 bg-gradient-to-br from-emerald-300 to-cyan-400 shadow-sm" />
      </span>
      {showName && <span className={`whitespace-nowrap font-bold tracking-tight ${nameClassName}`}>AeroPulse <span className="text-emerald-500">AI</span></span>}
    </span>
  );
}
