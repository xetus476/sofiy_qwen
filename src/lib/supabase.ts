import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';

// Создаём клиент БЕЗ auth (используем service role через Edge Function)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Функция для верификации Telegram через Edge Function
export async function authenticateWithTelegram(): Promise<any | null> {
  console.log('🔍 authenticateWithTelegram called');
  alert('authenticateWithTelegram called'); // Временная отладка
  
  const tg = window.Telegram?.WebApp;
  console.log('📱 Telegram WebApp:', tg);
  console.log('📱 initData:', tg?.initData ? 'EXISTS' : 'MISSING');
  
  if (!tg?.initData) {
    console.log('📱 Not in Telegram, using demo mode');
    alert('Not in Telegram - using demo mode');
    return null;
  }

  try {
    console.log('🔐 Verifying Telegram initData...');
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/verify-telegram`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ initData: tg.initData }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.user) {
      console.log('✅ User authenticated:', result.user);
      return result.user;
    }

    throw new Error('Invalid response from Edge Function');
  } catch (error: any) {
    console.error('❌ Telegram auth error:', error.message);
    return null;
  }
}
