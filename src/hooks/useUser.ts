import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getTelegramUser } from '../lib/telegram';
import type { User } from '../types';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const tgUser = getTelegramUser();
      
      if (!tgUser) {
        // Demo mode — create a mock user
        const mockUser: User = {
          id: 'demo-user-id',
          tg_id: 123456789,
          username: 'demo_user',
          first_name: 'Демо',
          monthly_income: 0,
          created_at: new Date().toISOString(),
        };
        setUser(mockUser);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('tg_id', tgUser.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setUser(data);
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            tg_id: tgUser.id,
            username: tgUser.username || null,
            first_name: tgUser.first_name || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setUser(newUser);
      }
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message);
      // Fallback to demo mode
      const mockUser: User = {
        id: 'demo-user-id',
        tg_id: 123456789,
        username: 'demo_user',
        first_name: 'Демо',
        monthly_income: 0,
        created_at: new Date().toISOString(),
      };
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIncome = useCallback(async (income: number) => {
    if (!user) return;
    try {
      const { data, error: updateError } = await supabase
        .from('users')
        .update({ monthly_income: income })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setUser(prev => prev ? { ...prev, monthly_income: income } : null);
      return data;
    } catch (err: any) {
      // Optimistic update in demo mode
      setUser(prev => prev ? { ...prev, monthly_income: income } : null);
      console.error('Error updating income:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, updateIncome, refetch: fetchUser };
}
