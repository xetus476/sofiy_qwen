import { formatCurrency } from '../lib/utils';

interface IncomeBlockProps {
  income: number;
  onEdit: () => void;
}

export function IncomeBlock({ income, onEdit }: IncomeBlockProps) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">Заработная плата</p>
          {income > 0 ? (
            <p className="text-2xl font-bold mt-1">{formatCurrency(income)}</p>
          ) : (
            <p className="text-sm mt-1 opacity-90">Укажите вашу ЗП за месяц</p>
          )}
        </div>
        <button
          onClick={onEdit}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
        >
          <span className="text-lg">✏️</span>
        </button>
      </div>
    </div>
  );
}
