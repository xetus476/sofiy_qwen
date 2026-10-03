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
      console.log('🚀 [AuthContext] Starting user fetch...');
      setLoading(true);
      setError(null);

      // Пытаемся авторизоваться через Telegram Edge Function
      const authenticatedUser = await authenticateWithTelegram();

      if (authenticatedUser) {
        console.log('✅ [AuthContext] User authenticated via Edge Function:', authenticatedUser);
        setUser(authenticatedUser);
        return;
      }

      // Если не в Telegram или Edge Function не работает — пробуем локальный режим
      const tgUser = getTelegramUser();
      console.log('👤 [AuthContext] Telegram user from WebApp:', tgUser);
      
      if (tgUser) {
        // Мы в Telegram, но Edge Function не сработала
        console.log('⚠️ [AuthContext] In Telegram but Edge Function failed, trying direct DB access');
        
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('tg_id', tgUser.id)
          .maybeSingle();

        if (!fetchError && existingUser) {
          console.log('✅ [AuthContext] Found existing user:', existingUser);
          setUser(existingUser);
          return;
        }

        // Создаём нового пользователя
        console.log('🆕 [AuthContext] Creating new user...');
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
          console.log('✅ [AuthContext] New user created:', newUser);
          setUser(newUser);
          return;
        } else {
          console.error('❌ [AuthContext] Error creating user:', insertError);
        }
      }

      // Локальный режим: ищем первого пользователя в БД
      console.log('🔍 [AuthContext] Trying local mode: fetching first user from DB...');
      const { data: localUser, error: localError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!localError && localUser) {
        console.log('✅ [AuthContext] Using local user:', localUser);
        setUser(localUser);
        return;
      }

      // Если нет пользователей — создаём демо
      console.log('🆕 [AuthContext] No users found, creating demo user...');
      const { data: demoUser, error: demoError } = await supabase
        .from('users')
        .insert({
          tg_id: 999999999,
          username: 'demo_local',
          first_name: 'Демо',
          monthly_income: 85000,
        })
        .select()
        .single();

      if (!demoError && demoUser) {
        console.log('✅ [AuthContext] Demo user created:', demoUser);
        setUser(demoUser);
        return;
      }

      // Fallback на хардкод (если Supabase недоступен)
      console.log('📱 [AuthContext] Supabase unavailable, using hardcoded demo mode');
      const hardcodedUser: User = {
        id: 'demo-user',
        tg_id: 123456789,
        username: 'demo_user',
        first_name: 'Демо',
        monthly_income: 85000,
        created_at: new Date().toISOString(),
      };
      setUser(hardcodedUser);
    } catch (err: any) {
      console.error('❌ [AuthContext] Error:', err.message);
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
      console.log('🏁 [AuthContext] User fetch complete. User:', user?.id || 'null');
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
