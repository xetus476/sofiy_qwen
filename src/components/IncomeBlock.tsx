import { formatCurrency } from '../lib/utils';

interface IncomeBlockProps {
  income: number;
  onEdit: () => void;
  onAdd: () => void;
}

export function IncomeBlock({ income, onEdit, onAdd }: IncomeBlockProps) {
  return (
    <div className="p-4 rounded-2xl lavender-gradient text-white lavender-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">Заработная плата</p>
          {income > 0 ? (
            <p className="text-2xl font-bold mt-1">{formatCurrency(income)}</p>
          ) : (
            <p className="text-sm mt-1 opacity-90">Укажите вашу ЗП за месяц</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAdd}
            className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center active:scale-90 transition-transform backdrop-blur-sm"
            title="Увеличить зарплату"
          >
            <span className="text-lg">➕</span>
          </button>
          <button
            onClick={onEdit}
            className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center active:scale-90 transition-transform backdrop-blur-sm"
            title="Редактировать зарплату"
          >
            <span className="text-lg">✏️</span>
          </button>
        </div>
      </div>
    </div>
  );
}
