import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction, Category } from '../types';
import { getFirstDayOfMonth, getLastDayOfMonth } from '../lib/utils';

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (month?: number, year?: number) => {
    if (!userId) return;
    try {
      setLoading(true);
      const now = new Date();
      const m = month || now.getMonth() + 1;
      const y = year || now.getFullYear();
      const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0);
      const lastDayStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', userId)
        .gte('date', firstDay)
        .lte('date', lastDayStr)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addTransaction = useCallback(async (categoryId: string, amount: number, type: 'expense' | 'income', note?: string) => {
    if (!userId) {
      // Demo mode - optimistic update
      const newTransaction: Transaction = {
        id: crypto.randomUUID?.() || Math.random().toString(36),
        user_id: 'demo',
        category_id: categoryId,
        amount,
        type,
        note: note || null,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      };
      setTransactions(prev => [newTransaction, ...prev]);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          category_id: categoryId,
          amount,
          type,
          note: note || null,
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setTransactions(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      throw err;
    }
  }, [userId]);

  const getExpensesByCategory = useCallback((month?: number, year?: number) => {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categoryTotals[t.category_id] = (categoryTotals[t.category_id] || 0) + Number(t.amount);
      }
    });
    return categoryTotals;
  }, [transactions]);

  useEffect(() => {
    if (userId) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [userId, fetchTransactions]);

  return { transactions, loading, error, fetchTransactions, addTransaction, getExpensesByCategory };
}
