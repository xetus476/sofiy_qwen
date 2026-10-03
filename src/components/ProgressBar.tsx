import { motion } from 'framer-motion';
import { getProgressColor } from '../lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export function ProgressBar({ value, color, height = 8, showLabel = false }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const barColor = color || getProgressColor(clampedValue);

  return (
    <div className="w-full">
      <div
        className="w-full rounded-full overflow-hidden bg-[var(--lavender-100)]"
        style={{ height }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--tg-theme-hint-color)] mt-1">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
