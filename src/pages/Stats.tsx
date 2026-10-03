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

  // Filter transactions for current month
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
  });

  // Calculate expenses by category
  const expensesByCategory: Record<string, number> = {};
  monthTransactions.forEach(t => {
    if (t.type === 'expense') {
      expensesByCategory[t.category_id] = (expensesByCategory[t.category_id] || 0) + Number(t.amount);
    }
  });

  // Filter budgets for current month
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
      {/* Header */}
      <h1 className="text-xl font-bold">📊 Статистика</h1>

      {/* Month Switcher */}
      <div className="flex items-center justify-between bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] rounded-2xl p-3">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center active:scale-90 transition-transform shadow-sm text-sm">
          ←
        </button>
        <span className="font-semibold text-sm">{getMonthName(currentMonth)} {currentYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center active:scale-90 transition-transform shadow-sm text-sm">
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
              className="p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                {planned > 0 ? (
                  <span className="text-xs text-gray-500">
                    {formatCurrency(spent)} / {formatCurrency(planned)}
                  </span>
                ) : (
                  <button
                    onClick={() => openBudgetSheet(category.id)}
                    className="text-xs text-indigo-500 font-medium active:scale-95 transition-transform"
                  >
                    Установить лимит
                  </button>
                )}
              </div>
              {planned > 0 ? (
                <>
                  <ProgressBar value={percent} height={6} />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      Потрачено {formatCurrency(spent)}
                    </span>
                    <span className="text-xs font-medium" style={{ color: percent < 70 ? '#10B981' : percent < 90 ? '#F59E0B' : '#EF4444' }}>
                      {Math.round(percent)}%
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-400">План не задан</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <p className="text-xs text-blue-600 dark:text-blue-400">Осталось по бюджету</p>
          <p className={`text-lg font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
          <p className="text-xs text-purple-600 dark:text-purple-400">Свободные деньги</p>
          <p className={`text-lg font-bold ${freeMoney >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(freeMoney)}
          </p>
        </div>
      </div>

      {/* Income */}
      <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
        <p className="text-xs text-green-600 dark:text-green-400">Доход</p>
        <p className="text-lg font-bold text-green-700 dark:text-green-300">
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
            <label className="text-sm text-gray-500 mb-1 block">Планируемая сумма на месяц</label>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="0 ₽"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-lg font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--tg-theme-text-color,#000)]"
              inputMode="numeric"
              autoFocus
            />
          </div>
          <button
            onClick={handleSetBudget}
            className="w-full py-3 rounded-xl bg-[var(--tg-theme-button-color,#3390ec)] text-white font-medium active:scale-[0.98] transition-transform"
          >
            Сохранить лимит
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
