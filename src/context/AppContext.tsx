import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Category, Transaction, Budget, Goal } from '../types';

// Категории по умолчанию (запасной вариант)
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Жильё', icon: '🏠', color: '#6366F1', sort_order: 1 },
  { id: '2', name: 'ЖКХ', icon: '💡', color: '#F59E0B', sort_order: 2 },
  { id: '3', name: 'Продукты', icon: '🛒', color: '#10B981', sort_order: 3 },
  { id: '4', name: 'Кафе и доставка', icon: '🍔', color: '#EF4444', sort_order: 4 },
  { id: '5', name: 'Косметика', icon: '💄', color: '#EC4899', sort_order: 5 },
  { id: '6', name: 'Транспорт', icon: '🚌', color: '#3B82F6', sort_order: 6 },
  { id: '7', name: 'Маркетплейсы', icon: '📦', color: '#8B5CF6', sort_order: 7 },
];

// Демо-данные (используются только для demo-user)
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
  user: { id: string; monthly_income: number; [key: string]: any };
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  loading: boolean;
  updateIncome: (income: number) => Promise<void>;
  addTransaction: (categoryId: string, amount: number, type: 'expense' | 'income', note?: string) => Promise<void>;
  setBudget: (categoryId: string, month: number, year: number, amount: number) => Promise<void>;
  createGoal: (title: string, targetAmount: number, icon: string) => Promise<void>;
  updateGoalAmount: (goalId: string, delta: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const isDemo = user?.id === 'demo-user';

  // Загрузка категорий
  const loadCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (!error && data && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      console.log('Using default categories');
    }
  }, []);

  // Загрузка транзакций
  const loadTransactions = useCallback(async () => {
    if (!user || isDemo) return;
    try {
      console.log('📥 Loading transactions for user:', user.id);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('❌ Error loading transactions:', error);
        throw error;
      }
      console.log('✅ Loaded transactions:', data?.length || 0);
      setTransactions(data || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  }, [user, isDemo]);

  // Загрузка бюджетов
  const loadBudgets = useCallback(async () => {
    if (!user || isDemo) return;
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      console.error('Error loading budgets:', err);
    }
  }, [user, isDemo]);

  // Загрузка целей
  const loadGoals = useCallback(async () => {
    if (!user || isDemo) return;
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Error loading goals:', err);
    }
  }, [user, isDemo]);

  // Загрузка всех данных
  const refreshData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    await loadCategories();
    
    if (isDemo) {
      setTransactions(DEMO_TRANSACTIONS);
      setBudgets(DEMO_BUDGETS);
      setGoals(DEMO_GOALS);
    } else {
      await Promise.all([loadTransactions(), loadBudgets(), loadGoals()]);
    }
    
    setLoading(false);
  }, [user, isDemo, loadCategories, loadTransactions, loadBudgets, loadGoals]);

  // Первоначальная загрузка
  useEffect(() => {
    if (!authLoading && user) {
      refreshData();
    }
  }, [authLoading, user, refreshData]);

  // Обновление дохода
  const updateIncome = useCallback(async (income: number) => {
    if (!user) return;
    
    if (isDemo) {
      // В демо-режиме просто логируем
      console.log('Demo mode: income update', income);
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ monthly_income: income })
        .eq('id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating income:', err);
      throw err;
    }
  }, [user, isDemo]);

  // Добавление транзакции
  const addTransaction = useCallback(async (categoryId: string, amount: number, type: 'expense' | 'income', note?: string) => {
    if (!user) return;

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

    // Оптимистичное обновление UI
    setTransactions(prev => [newTransaction, ...prev]);

    if (isDemo) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          amount,
          type,
          note: note || null,
          date: newTransaction.date,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Заменяем временную транзакцию на реальную
      setTransactions(prev => prev.map(t => t.id === newTransaction.id ? data : t));
    } catch (err) {
      console.error('Error adding transaction:', err);
      // Откатываем оптимистичное обновление
      setTransactions(prev => prev.filter(t => t.id !== newTransaction.id));
      throw err;
    }
  }, [user, isDemo]);

  // Установка бюджета
  const setBudget = useCallback(async (categoryId: string, month: number, year: number, amount: number) => {
    if (!user) return;

    // Оптимистичное обновление
    setBudgets(prev => {
      const existing = prev.findIndex(b => b.category_id === categoryId && b.month === month && b.year === year);
      const newBudget: Budget = {
        id: crypto.randomUUID?.() || Math.random().toString(36),
        user_id: user.id,
        category_id: categoryId,
        month,
        year,
        planned_amount: amount,
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newBudget;
        return updated;
      }
      return [...prev, newBudget];
    });

    if (isDemo) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          category_id: categoryId,
          month,
          year,
          planned_amount: amount,
        }, {
          onConflict: 'user_id,category_id,month,year'
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error setting budget:', err);
      throw err;
    }
  }, [user, isDemo]);

  // Создание цели
  const createGoal = useCallback(async (title: string, targetAmount: number, icon: string) => {
    if (!user) return;

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

    // Оптимистичное обновление
    setGoals(prev => [newGoal, ...prev]);

    if (isDemo) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title,
          target_amount: targetAmount,
          icon,
        })
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === newGoal.id ? data : g));
    } catch (err) {
      console.error('Error creating goal:', err);
      setGoals(prev => prev.filter(g => g.id !== newGoal.id));
      throw err;
    }
  }, [user, isDemo]);

  // Обновление суммы цели
  const updateGoalAmount = useCallback(async (goalId: string, delta: number) => {
    if (!user) return;

    // Оптимистичное обновление
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

    if (isDemo) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newAmount = Math.max(0, goal.current_amount + delta);
      const isCompleted = newAmount >= goal.target_amount;

      const { error } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted,
        })
        .eq('id', goalId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating goal:', err);
      // Откатываем
      await loadGoals();
      throw err;
    }
  }, [user, isDemo, goals, loadGoals]);

  // Удаление цели
  const deleteGoal = useCallback(async (goalId: string) => {
    if (!user) return;

    setGoals(prev => prev.filter(g => g.id !== goalId));

    if (isDemo) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting goal:', err);
      await loadGoals();
      throw err;
    }
  }, [user, isDemo, loadGoals]);

  return (
    <AppContext.Provider value={{
      user: user!,
      categories,
      transactions,
      budgets,
      goals,
      loading: loading || authLoading,
      updateIncome,
      addTransaction,
      setBudget,
      createGoal,
      updateGoalAmount,
      deleteGoal,
      refreshData,
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
