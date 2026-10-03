import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ProgressBar } from '../components/ProgressBar';
import { BottomSheet } from '../components/BottomSheet';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '../lib/utils';
import { hapticLight, hapticSuccess } from '../lib/telegram';

export function Stats() {
  const { user, categories, transactions, budgets, setBudget } = useAppContext();

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [currentYear, setCurrentYear] = useState(getCurrentYear());
  const [showBudgetSheet, setShowBudgetSheet] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState('');

  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  });

  const expensesByCategory: Record<string, number> = {};
  monthTransactions.forEach(t => {
    if (t.type === 'expense') {
      expensesByCategory[t.category_id] = (expensesByCategory[t.category_id] || 0) + Number(t.amount);
    }
  });

  const monthBudgets = budgets.filter(b => b.month === currentMonth && b.year === currentYear);
  
  const totalPlanned = monthBudgets.reduce((sum, b) => sum + Number(b.planned_amount), 0);
  const totalExpenses = Object.values(expensesByCategory).reduce((sum, v) => sum + v, 0);
  const remaining = totalPlanned - totalExpenses;
  const freeMoney = user.monthly_income - totalExpenses;

  const getBudgetForCategory = (categoryId: string) => {
    const budget = monthBudgets.find(b => b.category_id === categoryId);
    return budget ? Number(budget.planned_amount) : 0;
  };

  const handleSetBudget = () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount < 0 || !selectedCatId) return;
    setBudget(selectedCatId, currentMonth, currentYear, amount);
    hapticSuccess();
    setShowBudgetSheet(false);
    setBudgetInput('');
    setSelectedCatId(null);
  };

  const openBudgetSheet = (categoryId: string) => {
    setSelectedCatId(categoryId);
    const current = getBudgetForCategory(categoryId);
    setBudgetInput(current > 0 ? current.toString() : '');
    setShowBudgetSheet(true);
    hapticLight();
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectedCat = categories.find(c => c.id === selectedCatId);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">📊 Статистика</h1>

      {/* Month Switcher */}
      <div className="flex items-center justify-between bg-[var(--lavender-100)] rounded-2xl p-3 border border-[var(--lavender-200)]/50">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform shadow-sm text-sm">
          ←
        </button>
        <span className="font-semibold text-sm">{getMonthName(currentMonth)} {currentYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform shadow-sm text-sm">
          →
        </button>
      </div>

      {/* Budget by Category */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Бюджет по категориям</h2>
        {categories.map((category) => {
          const planned = getBudgetForCategory(category.id);
          const spent = expensesByCategory[category.id] || 0;
          const percent = planned > 0 ? (spent / planned) * 100 : 0;

          return (
            <div
              key={category.id}
              className="p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--lavender-200)]/30"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                {planned > 0 ? (
                  <span className="text-xs text-[var(--tg-theme-hint-color)]">
                    {formatCurrency(spent)} / {formatCurrency(planned)}
                  </span>
                ) : (
                  <button
                    onClick={() => openBudgetSheet(category.id)}
                    className="text-xs text-[var(--tg-theme-button-color)] font-medium active:scale-95 transition-transform"
                  >
                    Установить лимит
                  </button>
                )}
              </div>
              {planned > 0 ? (
                <>
                  <ProgressBar value={percent} height={6} />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-[var(--tg-theme-hint-color)]">
                      Потрачено {formatCurrency(spent)}
                    </span>
                    <span className="text-xs font-medium" style={{ color: percent < 70 ? '#10B981' : percent < 90 ? '#F59E0B' : '#EF4444' }}>
                      {Math.round(percent)}%
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-[var(--tg-theme-hint-color)]">План не задан</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Осталось по бюджету</p>
          <p className={`text-lg font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Свободные деньги</p>
          <p className={`text-lg font-bold ${freeMoney >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(freeMoney)}
          </p>
        </div>
      </div>

      {/* Income */}
      <div className="p-3 rounded-xl bg-[var(--lavender-100)] border border-[var(--lavender-200)]">
        <p className="text-xs text-[var(--lavender-700)] font-medium">Доход</p>
        <p className="text-lg font-bold text-[var(--lavender-900)]">
          {formatCurrency(user.monthly_income)}
        </p>
      </div>

      {/* Budget Sheet */}
      <BottomSheet
        isOpen={showBudgetSheet}
        onClose={() => setShowBudgetSheet(false)}
        title={selectedCat ? `Лимит: ${selectedCat.icon} ${selectedCat.name}` : 'Установить лимит'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[var(--tg-theme-hint-color)] mb-1 block">Планируемая сумма на месяц</label>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="0 ₽"
              className="w-full px-4 py-3 rounded-xl bg-[var(--lavender-100)] text-lg font-medium outline-none focus:ring-2 focus:ring-[var(--tg-theme-button-color)] text-[var(--tg-theme-text-color)]"
              inputMode="numeric"
              autoFocus
            />
          </div>
          <button
            onClick={handleSetBudget}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--tg-theme-button-color)] to-[var(--lavender-400)] text-white font-medium active:scale-[0.98] transition-transform lavender-shadow"
          >
            Сохранить лимит
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
