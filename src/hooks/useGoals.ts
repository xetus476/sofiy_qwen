import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Goal } from '../types';

export function useGoals(userId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setGoals(data || []);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err.message);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createGoal = useCallback(async (title: string, targetAmount: number, icon: string = '🎯') => {
    if (!userId) {
      // Demo mode
      const newGoal: Goal = {
        id: crypto.randomUUID?.() || Math.random().toString(36),
        user_id: 'demo',
        title,
        target_amount: targetAmount,
        current_amount: 0,
        icon,
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          title,
          target_amount: targetAmount,
          icon,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setGoals(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      console.error('Error creating goal:', err);
      throw err;
    }
  }, [userId]);

  const updateGoalAmount = useCallback(async (goalId: string, delta: number) => {
    if (!userId) {
      // Demo mode
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
      return;
    }

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newAmount = Math.max(0, goal.current_amount + delta);
      const isCompleted = newAmount >= goal.target_amount;

      const { data, error: updateError } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted,
        })
        .eq('id', goalId)
        .select()
        .single();

      if (updateError) throw updateError;
      setGoals(prev => prev.map(g => g.id === goalId ? data : g));
    } catch (err: any) {
      console.error('Error updating goal:', err);
      throw err;
    }
  }, [userId, goals]);

  const deleteGoal = useCallback(async (goalId: string) => {
    if (!userId) {
      setGoals(prev => prev.filter(g => g.id !== goalId));
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (deleteError) throw deleteError;
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      throw err;
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchGoals();
    } else {
      setLoading(false);
    }
  }, [userId, fetchGoals]);

  return { goals, loading, error, fetchGoals, createGoal, updateGoalAmount, deleteGoal };
}
