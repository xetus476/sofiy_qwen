import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, authenticateWithTelegram } from '../lib/supabase';
import { getTelegramUser } from '../lib/telegram';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      console.log('🚀 AuthContext: Starting user fetch...');
      alert('AuthContext: Starting user fetch'); // Временная отладка
      
      setLoading(true);
      setError(null);

      // Пытаемся авторизоваться через Telegram Edge Function
      console.log('🔐 Calling authenticateWithTelegram...');
      const authenticatedUser = await authenticateWithTelegram();
      console.log('📥 authenticateWithTelegram result:', authenticatedUser);

      if (authenticatedUser) {
        // Успешная авторизация — используем реального пользователя
        console.log('✅ User authenticated:', authenticatedUser);
        setUser(authenticatedUser);
        return;
      }

      // Если не в Telegram или ошибка — проверяем наличие tg_user
      const tgUser = getTelegramUser();
      
      if (tgUser) {
        // Мы в Telegram, но Edge Function не сработала
        // Пытаемся найти/создать пользователя напрямую
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('tg_id', tgUser.id)
          .maybeSingle();

        if (!fetchError && existingUser) {
          setUser(existingUser);
          return;
        }

        // Создаём нового пользователя
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            tg_id: tgUser.id,
            username: tgUser.username || null,
            first_name: tgUser.first_name || null,
            monthly_income: 0,
          })
          .select()
          .single();

        if (!insertError && newUser) {
          setUser(newUser);
          return;
        }
      }

      // Fallback на демо-режим
      console.log('📱 Using demo mode');
      const demoUser: User = {
        id: 'demo-user',
        tg_id: 123456789,
        username: 'demo_user',
        first_name: 'Демо',
        monthly_income: 85000,
        created_at: new Date().toISOString(),
      };
      setUser(demoUser);
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.message);
      
      // Fallback на демо-режим при ошибке
      const demoUser: User = {
        id: 'demo-user',
        tg_id: 123456789,
        username: 'demo_user',
        first_name: 'Демо',
        monthly_income: 85000,
        created_at: new Date().toISOString(),
      };
      setUser(demoUser);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, refetch: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
