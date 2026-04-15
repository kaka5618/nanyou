'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  name: string;
  className?: string;
}

export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2', className)}>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.6s',
            }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500">{name}正在输入...</span>
    </div>
  );
}
