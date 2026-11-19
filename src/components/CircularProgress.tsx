import React, { useId } from 'react';
import { motion } from 'motion/react';

interface CircularProgressProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  size = 84,
  strokeWidth = 8,
  label,
  sublabel,
  gradientFrom = '#16C7D9',
  gradientTo = '#873BFF',
  className = '',
  children,
}: CircularProgressProps) {
  const gradId = useId();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200/90 dark:stroke-white/[0.08]"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="drop-shadow-[0_0_6px_rgba(135,59,255,0.28)]"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            <span
              className="font-mono font-bold tabular-nums text-slate-900 dark:text-white leading-none"
              style={{ fontSize: Math.max(13, Math.round(size * 0.22)) }}
            >
              {label ?? `${Math.round(clamped)}%`}
            </span>
            {sublabel && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                {sublabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
