import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, Category, Transaction, Budget, Goal } from '../types';

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Жильё', icon: '🏠', color: '#6366F1', sort_order: 1 },
  { id: '2', name: 'ЖКХ', icon: '💡', color: '#F59E0B', sort_order: 2 },
  { id: '3', name: 'Продукты', icon: '🛒', color: '#10B981', sort_order: 3 },
  { id: '4', name: 'Кафе и доставка', icon: '🍔', color: '#EF4444', sort_order: 4 },
  { id: '5', name: 'Косметика', icon: '💄', color: '#EC4899', sort_order: 5 },
  { id: '6', name: 'Транспорт', icon: '🚌', color: '#3B82F6', sort_order: 6 },
  { id: '7', name: 'Маркетплейсы', icon: '📦', color: '#8B5CF6', sort_order: 7 },
];

// Demo data
const DEMO_USER: User = {
  id: 'demo-user',
  tg_id: 123456789,
  username: 'demo_user',
  first_name: 'Демо',
  monthly_income: 85000,
  created_at: new Date().toISOString(),
};

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: '1', user_id: 'demo', category_id: '1', amount: 25000, type: 'expense', note: 'Аренда', date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '2', user_id: 'demo', category_id: '3', amount: 5200, type: 'expense', note: 'Продукты на неделю', date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '3', user_id: 'demo', category_id: '4', amount: 1800, type: 'expense', note: 'Обед', date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '4', user_id: 'demo', category_id: '2', amount: 4500, type: 'expense', note: 'Коммуналка', date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '5', user_id: 'demo', category_id: '6', amount: 2000, type: 'expense', note: 'Проезд', date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: '6', user_id: 'demo', category_id: '7', amount: 3500, type: 'expense', note: 'Wildberries', date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
];

const DEMO_BUDGETS: Budget[] = [
  { id: '1', user_id: 'demo', category_id: '1', month: new Date().getMonth() + 1, year: new Date().getFullYear(), planned_amount: 27000 },
  { id: '2', user_id: 'demo', category_id: '2', month: new Date().getMonth() + 1, year: new Date().getFullYear(), planned_amount: 6000 },
  { id: '3', user_id: 'demo', category_id: '3', month: new Date().getMonth() + 1, year: new Date().getFullYear(), planned_amount: 20000 },
  { id: '4', user_id: 'demo', category_id: '4', month: new Date().getMonth() + 1, year: new Date().getFullYear(), planned_amount: 8000 },
  { id: '5', user_id: 'demo', category_id: '5', month: new Date().getMonth() + 1, year: new Date().getFullYear(), planned_amount: 5000 },
  { id: '6', user_id: 'demo', category_id: '6', month: new Date().getMonth() + 1, year: new Date().getFullYear(), planned_amount: 4000 },
  { id: '7', user_id: 'demo', category_id: '7', month: new Date().getMonth() + 1, year: new Date().getFullYear(), planned_amount: 7000 },
];

const DEMO_GOALS: Goal[] = [
  { id: '1', user_id: 'demo', title: 'Отпуск в Турции', target_amount: 150000, current_amount: 67000, icon: '✈️', is_completed: false, created_at: new Date().toISOString() },
  { id: '2', user_id: 'demo', title: 'Новый ноутбук', target_amount: 120000, current_amount: 45000, icon: '💻', is_completed: false, created_at: new Date().toISOString() },
  { id: '3', user_id: 'demo', title: 'Подушка безопасности', target_amount: 300000, current_amount: 300000, icon: '🛡️', is_completed: true, created_at: new Date().toISOString() },
];

interface AppContextType {
  user: User;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  updateIncome: (income: number) => void;
  addTransaction: (categoryId: string, amount: number, type: 'expense' | 'income', note?: string) => void;
  setBudget: (categoryId: string, month: number, year: number, amount: number) => void;
  createGoal: (title: string, targetAmount: number, icon: string) => void;
  updateGoalAmount: (goalId: string, delta: number) => void;
  deleteGoal: (goalId: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(DEMO_USER);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(DEMO_BUDGETS);
  const [goals, setGoals] = useState<Goal[]>(DEMO_GOALS);

  const updateIncome = useCallback((income: number) => {
    setUser(prev => ({ ...prev, monthly_income: income }));
  }, []);

  const addTransaction = useCallback((categoryId: string, amount: number, type: 'expense' | 'income', note?: string) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      user_id: user.id,
      category_id: categoryId,
      amount,
      type,
      note: note || null,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  }, [user.id]);

  const setBudgetAction = useCallback((categoryId: string, month: number, year: number, amount: number) => {
    setBudgets(prev => {
      const existing = prev.findIndex(b => b.category_id === categoryId && b.month === month && b.year === year);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], planned_amount: amount };
        return updated;
      }
      return [...prev, {
        id: crypto.randomUUID?.() || Math.random().toString(36),
        user_id: user.id,
        category_id: categoryId,
        month,
        year,
        planned_amount: amount,
      }];
    });
  }, [user.id]);

  const createGoal = useCallback((title: string, targetAmount: number, icon: string) => {
    const newGoal: Goal = {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      user_id: user.id,
      title,
      target_amount: targetAmount,
      current_amount: 0,
      icon,
      is_completed: false,
      created_at: new Date().toISOString(),
    };
    setGoals(prev => [newGoal, ...prev]);
  }, [user.id]);

  const updateGoalAmount = useCallback((goalId: string, delta: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        const newAmount = Math.max(0, g.current_amount + delta);
        return {
          ...g,
          current_amount: newAmount,
          is_completed: newAmount >= g.target_amount,
        };
      }
      return g;
    }));
  }, []);

  const deleteGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  }, []);

  return (
    <AppContext.Provider value={{
      user, categories, transactions, budgets, goals,
      updateIncome, addTransaction, setBudget: setBudgetAction,
      createGoal, updateGoalAmount, deleteGoal,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
