import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Budget } from '../types';

export function useBudgets(userId: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async (month: number, year: number) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('budgets')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year);

      if (fetchError) throw fetchError;
      setBudgets(data || []);
    } catch (err: any) {
      console.error('Error fetching budgets:', err);
      setError(err.message);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const setBudget = useCallback(async (categoryId: string, month: number, year: number, amount: number) => {
    if (!userId) {
      // Demo mode
      const newBudget: Budget = {
        id: crypto.randomUUID?.() || Math.random().toString(36),
        user_id: 'demo',
        category_id: categoryId,
        month,
        year,
        planned_amount: amount,
      };
      setBudgets(prev => {
        const existing = prev.findIndex(b => b.category_id === categoryId && b.month === month && b.year === year);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newBudget;
          return updated;
        }
        return [...prev, newBudget];
      });
      return;
    }

    try {
      const { data, error: upsertError } = await supabase
        .from('budgets')
        .upsert({
          user_id: userId,
          category_id: categoryId,
          month,
          year,
          planned_amount: amount,
        }, {
          onConflict: 'user_id,category_id,month,year'
        })
        .select()
        .single();

      if (upsertError) throw upsertError;
      
      setBudgets(prev => {
        const existing = prev.findIndex(b => b.category_id === categoryId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    } catch (err: any) {
      console.error('Error setting budget:', err);
      throw err;
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const now = new Date();
      fetchBudgets(now.getMonth() + 1, now.getFullYear());
    } else {
      setLoading(false);
    }
  }, [userId, fetchBudgets]);

  return { budgets, loading, error, fetchBudgets, setBudget };
}
