import type { Category } from '../types';
import { formatCurrency } from '../lib/utils';

interface CategoryCardProps {
  category: Category;
  spent: number;
  onClick: () => void;
}

export function CategoryCard({ category, spent, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] active:scale-95 transition-transform"
      style={{ borderLeft: `3px solid ${category.color}` }}
    >
      <span className="text-2xl mb-1">{category.icon}</span>
      <span className="text-xs font-medium text-[var(--tg-theme-text-color,#000)] text-center leading-tight">
        {category.name}
      </span>
      <span className="text-xs font-bold mt-1" style={{ color: category.color }}>
        {formatCurrency(spent)}
      </span>
    </button>
  );
}
