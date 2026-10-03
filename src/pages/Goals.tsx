import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { GoalCard } from '../components/GoalCard';
import { BottomSheet } from '../components/BottomSheet';
import { hapticLight, hapticSuccess } from '../lib/telegram';

export function Goals() {
  const { goals, createGoal, updateGoalAmount, deleteGoal } = useAppContext();

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showSpendSheet, setShowSpendSheet] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalIcon, setGoalIcon] = useState('🎯');
  const [filter, setFilter] = useState<'active' | 'completed'>('active');

  const filteredGoals = goals.filter(g =>
    filter === 'active' ? !g.is_completed : g.is_completed
  );

  const handleCreateGoal = () => {
    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0 || !goalTitle.trim()) return;
    createGoal(goalTitle, amount, goalIcon);
    hapticSuccess();
    setShowCreateSheet(false);
    setGoalTitle('');
    setGoalAmount('');
    setGoalIcon('🎯');
  };

  const handleAddToGoal = () => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0 || !selectedGoalId) return;
    updateGoalAmount(selectedGoalId, amount);
    hapticSuccess();
    setShowAddSheet(false);
    setAmountInput('');
    setSelectedGoalId(null);
  };

  const handleSpendFromGoal = () => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0 || !selectedGoalId) return;
    updateGoalAmount(selectedGoalId, -amount);
    hapticLight();
    setShowSpendSheet(false);
    setAmountInput('');
    setSelectedGoalId(null);
  };

  const goalIcons = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🏖️', '🎁', '👗', '🎮'];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🎯 Цели</h1>
        <button
          onClick={() => setShowCreateSheet(true)}
          className="px-3 py-1.5 rounded-xl bg-[var(--tg-theme-button-color,#3390ec)] text-white text-sm font-medium active:scale-95 transition-transform"
        >
          + Новая
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          Активные ({goals.filter(g => !g.is_completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          Достигнутые ({goals.filter(g => g.is_completed).length})
        </button>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl">{filter === 'active' ? '🎯' : '🏆'}</span>
          <p className="text-gray-500 mt-3">
            {filter === 'active' ? 'Нет активных целей' : 'Нет достигнутых целей'}
          </p>
          {filter === 'active' && (
            <button
              onClick={() => setShowCreateSheet(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium active:scale-95 transition-transform"
            >
              Создать первую цель
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAdd={() => {
                setSelectedGoalId(goal.id);
                setAmountInput('');
                setShowAddSheet(true);
                hapticLight();
              }}
              onSpend={() => {
                setSelectedGoalId(goal.id);
                setAmountInput('');
                setShowSpendSheet(true);
                hapticLight();
              }}
            />
          ))}
        </div>
      )}

      {/* Create Goal Sheet */}
      <BottomSheet
        isOpen={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        title="Новая цель"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Название цели</label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="Например: Отпуск в Турции"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-base outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--tg-theme-text-color,#000)]"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Целевая сумма</label>
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
              {goalIcons.map(icon => (
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

      {/* Add Money Sheet */}
      <BottomSheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="💰 Отложить деньги"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Сумма</label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0 ₽"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-lg font-medium outline-none focus:ring-2 focus:ring-green-500 text-[var(--tg-theme-text-color,#000)]"
              inputMode="numeric"
              autoFocus
            />
          </div>
          <button
            onClick={handleAddToGoal}
            className="w-full py-3 rounded-xl bg-green-500 text-white font-medium active:scale-[0.98] transition-transform"
          >
            + Отложить
          </button>
        </div>
      </BottomSheet>

      {/* Spend Money Sheet */}
      <BottomSheet
        isOpen={showSpendSheet}
        onClose={() => setShowSpendSheet(false)}
        title="💸 Потратить из цели"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Сумма</label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0 ₽"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-lg font-medium outline-none focus:ring-2 focus:ring-red-500 text-[var(--tg-theme-text-color,#000)]"
              inputMode="numeric"
              autoFocus
            />
          </div>
          <button
            onClick={handleSpendFromGoal}
            className="w-full py-3 rounded-xl bg-red-500 text-white font-medium active:scale-[0.98] transition-transform"
          >
            − Потратить
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
