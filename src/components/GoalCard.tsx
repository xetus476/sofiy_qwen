import type { Goal } from '../types';
import { formatCurrency } from '../lib/utils';
import { ProgressBar } from './ProgressBar';

interface GoalCardProps {
  goal: Goal;
  onAdd: () => void;
  onSpend: () => void;
}

export function GoalCard({ goal, onAdd, onSpend }: GoalCardProps) {
  const percent = goal.target_amount > 0
    ? (goal.current_amount / goal.target_amount) * 100
    : 0;

  return (
    <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--lavender-200)]/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{goal.icon}</span>
          <span className="font-semibold text-[var(--tg-theme-text-color)]">
            {goal.title}
          </span>
        </div>
        {goal.is_completed && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            🎉 Достигнута
          </span>
        )}
      </div>

      <ProgressBar
        value={percent}
        color={goal.is_completed ? '#10B981' : '#9B87F5'}
        height={10}
      />

      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-[var(--tg-theme-hint-color)]">
          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
        </span>
        <span className="text-sm font-medium" style={{ color: goal.is_completed ? '#10B981' : '#9B87F5' }}>
          {Math.min(100, Math.round(percent))}%
        </span>
      </div>

      {!goal.is_completed && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={onAdd}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-green-400 to-green-500 text-white text-sm font-medium active:scale-95 transition-transform shadow-sm"
          >
            + Отложить
          </button>
          <button
            onClick={onSpend}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-red-400 to-red-500 text-white text-sm font-medium active:scale-95 transition-transform shadow-sm"
          >
            − Потратить
          </button>
        </div>
      )}
    </div>
  );
}
