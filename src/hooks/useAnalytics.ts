import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction, MonthlyData, CategoryExpense, Category } from '../types';
import { getMonthNameShort } from '../lib/utils';

export function useAnalytics(userId: string | undefined) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (months: number = 6) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      // Aggregate by month
      const monthMap: Record<string, { income: number; expenses: number }> = {};
      
      // Initialize all months
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        monthMap[key] = { income: 0, expenses: 0 };
      }

      (transactions || []).forEach((t: any) => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (monthMap[key]) {
          if (t.type === 'income') {
            monthMap[key].income += Number(t.amount);
          } else {
            monthMap[key].expenses += Number(t.amount);
          }
        }
      });

      const data: MonthlyData[] = Object.entries(monthMap).map(([key, val]) => {
        const [y, m] = key.split('-');
        return {
          month: getMonthNameShort(Number(m)),
          income: val.income,
          expenses: val.expenses,
        };
      });

      setMonthlyData(data);

      // Category expenses for current month
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const catMap: Record<string, { category: Category; amount: number }> = {};
      
      (transactions || []).forEach((t: any) => {
        const date = new Date(t.date);
        if (date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear && t.type === 'expense') {
          const catId = t.category_id;
          if (!catMap[catId] && t.category) {
            catMap[catId] = { category: t.category, amount: 0 };
          }
          if (catMap[catId]) {
            catMap[catId].amount += Number(t.amount);
          }
        }
      });

      const totalExpenses = Object.values(catMap).reduce((sum, c) => sum + c.amount, 0);
      const catExpenses: CategoryExpense[] = Object.values(catMap).map(c => ({
        category: c.category,
        amount: c.amount,
        percentage: totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0,
      })).sort((a, b) => b.amount - a.amount);

      setCategoryExpenses(catExpenses);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [userId, fetchAnalytics]);

  return { monthlyData, categoryExpenses, loading, error, fetchAnalytics };
}
