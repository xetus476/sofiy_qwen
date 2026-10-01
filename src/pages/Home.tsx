import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { IncomeBlock } from '../components/IncomeBlock';
import { CategoryCard } from '../components/CategoryCard';
import { BottomSheet } from '../components/BottomSheet';
import { hapticLight, hapticSuccess } from '../lib/telegram';
import { formatCurrency } from '../lib/utils';

export function Home() {
  const { user, categories, transactions, updateIncome, addTransaction, createGoal } = useAppContext();

  const [showIncomeSheet, setShowIncomeSheet] = useState(false);
  const [showExpenseSheet, setShowExpenseSheet] = useState(false);
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [incomeInput, setIncomeInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalIcon, setGoalIcon] = useState('🎯');

  // Calculate expenses by category for current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const expensesByCategory: Record<string, number> = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      const date = new Date(t.date);
      if (date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear) {
        expensesByCategory[t.category_id] = (expensesByCategory[t.category_id] || 0) + Number(t.amount);
      }
    }
  });

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, v) => sum + v, 0);

  const handleSaveIncome = () => {
    const amount = parseFloat(incomeInput);
    if (isNaN(amount) || amount < 0) return;
    updateIncome(amount);
    hapticSuccess();
    setShowIncomeSheet(false);
    setIncomeInput('');
  };

  const handleAddExpense = () => {
    const amount = parseFloat(expenseInput);
    if (isNaN(amount) || amount <= 0 || !selectedCategory) return;
    addTransaction(selectedCategory, amount, 'expense', expenseNote || undefined);
    hapticSuccess();
    setShowExpenseSheet(false);
    setExpenseInput('');
    setExpenseNote('');
    setSelectedCategory(null);
  };

  const handleCreateGoal = () => {
    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0 || !goalTitle.trim()) return;
    createGoal(goalTitle, amount, goalIcon);
    hapticSuccess();
    setShowGoalSheet(false);
    setGoalTitle('');
    setGoalAmount('');
    setGoalIcon('🎯');
  };

  const openExpenseSheet = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowExpenseSheet(true);
    hapticLight();
  };

  const selectedCat = categories.find(c => c.id === selectedCategory);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">💰 FinanceBot</h1>
        <span className="text-sm text-gray-500">
          {now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Income Block */}
      <IncomeBlock
        income={user.monthly_income}
        onEdit={() => {
          setIncomeInput(user.monthly_income.toString());
          setShowIncomeSheet(true);
        }}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/20">
          <p className="text-xs text-red-500">Расходы в этом месяце</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="p-3 rounded-2xl bg-green-50 dark:bg-green-900/20">
          <p className="text-xs text-green-500">Остаток</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(user.monthly_income - totalExpenses)}
          </p>
        </div>
      </div>

      {/* Add Goal Button */}
      <button
        onClick={() => setShowGoalSheet(true)}
        className="w-full py-3 px-4 rounded-2xl bg-[var(--tg-theme-button-color,#3390ec)] text-white font-medium text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <span>🎯</span>
        <span>+ Добавить цель</span>
      </button>

      {/* Categories Grid */}
      <div>
        <h2 className="text-base font-semibold mb-3">Категории расходов</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              spent={expensesByCategory[category.id] || 0}
              onClick={() => openExpenseSheet(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Income Bottom Sheet */}
      <BottomSheet
        isOpen={showIncomeSheet}
        onClose={() => setShowIncomeSheet(false)}
        title="Заработная плата"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Сумма в месяц</label>
            <input
              type="number"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value)}
              placeholder="Введите сумму"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-lg font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--tg-theme-text-color,#000)]"
              inputMode="numeric"
            />
          </div>
          <button
            onClick={handleSaveIncome}
            className="w-full py-3 rounded-xl bg-[var(--tg-theme-button-color,#3390ec)] text-white font-medium active:scale-[0.98] transition-transform"
          >
            Сохранить
          </button>
        </div>
      </BottomSheet>

      {/* Expense Bottom Sheet */}
      <BottomSheet
        isOpen={showExpenseSheet}
        onClose={() => setShowExpenseSheet(false)}
        title={selectedCat ? `${selectedCat.icon} ${selectedCat.name}` : 'Добавить расход'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Сумма расхода</label>
            <input
              type="number"
              value={expenseInput}
              onChange={(e) => setExpenseInput(e.target.value)}
              placeholder="0 ₽"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-lg font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--tg-theme-text-color,#000)]"
              inputMode="numeric"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Комментарий (необязательно)</label>
            <input
              type="text"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              placeholder="Например: Обед"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-base outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--tg-theme-text-color,#000)]"
            />
          </div>
          <button
            onClick={handleAddExpense}
            className="w-full py-3 rounded-xl bg-[var(--tg-theme-button-color,#3390ec)] text-white font-medium active:scale-[0.98] transition-transform"
          >
            Добавить расход
          </button>
        </div>
      </BottomSheet>

      {/* Goal Bottom Sheet */}
      <BottomSheet
        isOpen={showGoalSheet}
        onClose={() => setShowGoalSheet(false)}
        title="Новая цель"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Название цели</label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Например: Отпуск"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-base outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--tg-theme-text-color,#000)]"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Сколько нужно денег</label>
            <input
              type="number"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder="0 ₽"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-lg font-medium outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--tg-theme-text-color,#000)]"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Иконка</label>
            <div className="flex gap-2 flex-wrap">
              {['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🏖️', '🎁'].map(icon => (
                <button
                  key={icon}
                  onClick={() => setGoalIcon(icon)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                    goalIcon === icon
                      ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-110'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreateGoal}
            className="w-full py-3 rounded-xl bg-[var(--tg-theme-button-color,#3390ec)] text-white font-medium active:scale-[0.98] transition-transform"
          >
            Создать цель
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
